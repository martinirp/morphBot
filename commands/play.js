const MyCustomExtractor = require('./../myCustomExtractor');
const { Client, Message } = require('discord.js');

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

            // Certifique-se de que a URL extraída é válida
            url = resolved.url;
            console.log(`URL resolvida com sucesso: ${url}`);
            message.channel.send(`Coe ${message.author.displayName}, achei essa aqui ${url}. Serve?`);
        }

        // Verifique se a URL é válida antes de tentar tocá-la
        if (!url) {
            return message.channel.send('Não consegui encontrar uma URL válida para tocar.');
        }

        // Log para ver o link antes de tocar
        console.log(`Tentando tocar o link: ${url}`);

        try {
            // Tocar o link
            await client.distube.play(message.member.voice.channel, url, {
                member: message.member,
                textChannel: message.channel,
                message,
            });
        } catch (error) {
            console.error(`Erro ao tentar tocar a música: ${error}`);
            message.channel.send('Desculpa, não consegui tocar a música. Tente novamente mais tarde.');
        }

        // Chamar o comando save para armazenar o link
        const saveCommand = client.commands.get('save');
        if (saveCommand) {
            saveCommand.execute(message, client, [url]);
        }
    },
};
