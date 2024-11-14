const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');
const MyCustomExtractor = require('./../myCustomExtractor');

module.exports = {
    name: 'play',
    aliases: ['p'],
    inVoiceChannel: true,
    execute: async (message, client, args) => {
        const nameOrLinkVideo = args.join(' ');
        if (!nameOrLinkVideo) {
            return message.channel.send('Entre com um valor válido para pesquisa.');
        }

        const customExtractor = new MyCustomExtractor();
        let infoVideo = await customExtractor.resolve(nameOrLinkVideo);

        if (!infoVideo) {
            return message.channel.send('Vídeo não foi encontrado.');
        }

        message.channel.send(`To procurando aqui pae, pera ai...`);

        // Verifica se o usuário está em um canal de voz
        if (!message.member.voice.channel) {
            return message.channel.send('Você precisa estar em um canal de voz para que eu possa tocar a música!');
        }

        const channel = message.member.voice.channel;

        // Conectando ao canal de voz
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        // Usando ffmpeg para processar o áudio do vídeo
        const stream = spawn(ffmpeg, [
            '-i', infoVideo.url,       // URL do vídeo
            '-vn',                     // Desabilitar vídeo
            '-ac', '2',                 // 2 canais de áudio (estéreo)
            '-ar', '44100',             // Taxa de amostragem de 44.1kHz
            '-f', 'opus',               // Formato de saída: opus
            'pipe:1',                   // Enviar o áudio para a saída padrão (pipe)
        ]);

        // Criar o recurso de áudio para o Discord
        const audioResource = createAudioResource(stream.stdout, {
            inputType: 'opus',
        });

        // Criando o player de áudio para enviar ao canal de voz
        const player = createAudioPlayer();

        // Enviar o áudio para o canal de voz
        player.play(audioResource);

        // Adicionar o player ao player manager (que gerencia a reprodução)
        connection.subscribe(player);

        // Quando a música terminar, a conexão será desconectada
        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        // Enviar mensagem confirmando o que foi tocado
        message.channel.send(`Achei essa braba aqui ${infoVideo.url}`);

        saveUrlToFile(infoVideo.url);
    },
};

function saveUrlToFile(url) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, '..', 'playlist', 'videos.txt');

        // Lê o conteúdo do arquivo existente
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                // Se o erro não for "arquivo não encontrado", rejeita a promise
                return reject(err);
            }

            // Verifica se a URL já está presente no arquivo
            const urls = data
                ? data.split('\n').map((line) => line.trim())
                : [];
            if (urls.includes(url)) {
                return resolve(); // URL já existe, não faz nada
            }

            // Adiciona a URL ao arquivo
            fs.appendFile(filePath, `${url}\n`, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}
