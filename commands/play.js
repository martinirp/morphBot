const MyCustomExtractor = require('./../myCustomExtractor');
const { Client, Message } = require('discord.js');
const { SpotifyPlugin } = require('@distube/spotify');

// Caminho para o arquivo links.txt
const path = require('path');
const filePath = path.join(__dirname, '..', 'data', 'links.txt');

// Função para salvar o link no arquivo
function saveLink(link) {
    const fs = require('fs');
    try {
        // Verifica se o arquivo existe
        if (!fs.existsSync(filePath)) {
            // Se não existir, cria um arquivo vazio
            fs.writeFileSync(filePath, '', 'utf8');
        }
        // Adiciona o link ao arquivo
        fs.appendFileSync(filePath, link + '\n', 'utf8');
        console.log(`Link adicionado ao arquivo TXT: ${link}`);
    } catch (error) {
        console.error(`Erro ao salvar link: ${error}`);
    }
}

module.exports = {
    name: 'play',
    description: 'Toca uma música ou um link indicado',
    aliases: ['p'],
    inVoiceChannel: true,
    execute: async (message, client, args) => {
        const string = args.join(' ');
        if (!string) {
            return message.channel.send('Não dá pra procurar nada desse jeito!');
        }

        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|playlist\?|channel\/|user\/|c\/)?[A-Za-z0-9_-]+/;
        let url;

        // Verifica se a string é um link do YouTube
        if (string.startsWith('http')) {
            if (!youtubeRegex.test(string)) {
                return message.channel.send('Tá querendo me enganar? Isso não é um link do YouTube!');
            } else {
                url = string;
                message.channel.send(`Coe ${message.author.displayName}, vou tocar esse link`);
            }
        } else {
            // Caso não seja um link, utiliza o MyCustomExtractor para resolver o nome
            const teste = new MyCustomExtractor();
            const resolved = await teste.resolve(string);

            if (!resolved || !resolved.url) {
                return message.channel.send('Achei bosta!');
            }

            url = resolved.url;
            message.channel.send(`Coe ${message.author.displayName}, achei essa aqui ${url}. Serve?`);
        }

        try {
            // Tocar o link
            await client.distube.play(message.member.voice.channel, url, {
                member: message.member,
                textChannel: message.channel,
                message,
            });

            // Chamar o comando save para armazenar o link
            const saveCommand = client.commands.get('save');
            if (saveCommand) {
                saveCommand.execute(message, client, [url]);
            }

        } catch (error) {
            // Responde com erro e tenta buscar no Spotify
            console.error('Erro ao tentar reproduzir o vídeo:', error.message);
            message.channel.send('Ocorreu um erro ao tentar reproduzir o vídeo. Tente novamente mais tarde. Vou buscar no Spotify...');

            // Busca no Spotify usando o DisTube
            try {
                const spotifyResult = await client.distube.search(string, { limit: 1, type: 'track' });

                if (spotifyResult && spotifyResult.length > 0) {
                    const track = spotifyResult[0];
                    message.channel.send(`Achei no Spotify: ${track.name} por ${track.artist}. Vou tocar agora!`);
                    await client.distube.play(message.member.voice.channel, track.url, {
                        member: message.member,
                        textChannel: message.channel,
                        message,
                    });

                    // Chama o comando save para salvar o link do Spotify
                    const saveCommand = client.commands.get('save');
                    if (saveCommand) {
                        saveCommand.execute(message, client, [track.url]);
                    }
                } else {
                    message.channel.send('Não encontrei nada no Spotify. Tente novamente com outra música!');
                }

            } catch (spotifyError) {
                console.error('Erro ao buscar no Spotify:', spotifyError.message);
                message.channel.send('Ocorreu um erro ao tentar buscar no Spotify. Tente novamente mais tarde!');
            }
        }
    },
};
