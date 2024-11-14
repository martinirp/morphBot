const ytdl = require('ytdl-core');  // Adicionando o ytdl-core
const { Client, Message } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo links.txt
const filePath = path.join(__dirname, '..', 'data', 'links.txt');

// Função para salvar o link no arquivo
function saveLink(link) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '', 'utf8');
        }
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
            // Caso não seja um link, usamos o ytdl-core para buscar a URL
            try {
                const info = await ytdl.getInfo(string);  // Resolve o link a partir da pesquisa
                url = info.video_url;  // Pega a URL do vídeo
                message.channel.send(`Coe ${message.author.displayName}, achei essa aqui ${url}. Serve?`);
            } catch (error) {
                return message.channel.send('Não consegui encontrar esse vídeo!');
            }
        }

        console.log(`Tentando tocar o link: ${url}`);

        // Tocar o link
        client.distube.play(message.member.voice.channel, url, {
            member: message.member,
            textChannel: message.channel,
            message,
        });

        // Chamar o comando save para armazenar o link
        const saveCommand = client.commands.get('save');
        if (saveCommand) {
            saveCommand.execute(message, client, [url]);
        }
    },
};
