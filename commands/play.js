const MyCustomExtractor = require('./../myCustomExtractor');
const { Client, Message } = require('discord.js');
const path = require('path');
const filePath = path.join(__dirname, '..', 'data', 'links.txt');

function saveLink(link) {
    const fs = require('fs');
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

        console.log(`Comando 'play' recebido com os argumentos: ${args}`);

        // Verifica se a string é um link do YouTube
        if (string.startsWith('http')) {
            console.log(`Verificando URL: ${string}`);
            if (!youtubeRegex.test(string)) {
                console.log('O link não é um link válido do YouTube.');
                return message.channel.send('Tá querendo me enganar? Isso não é um link do YouTube!');
            } else {
                url = string;
                console.log(`Link do YouTube validado: ${url}`);
                message.channel.send(`Coe ${message.author.displayName}, vou tocar esse link`);
            }
        } else {
            // Caso não seja um link, utiliza o MyCustomExtractor para resolver o nome
            const teste = new MyCustomExtractor();
            console.log(`Buscando informações para: ${string}`);
            const resolved = await teste.resolve(string);

            // Adicionando validação para o resolved.url
            if (!resolved || !resolved.url || !youtubeRegex.test(resolved.url)) {
                console.log('Não foi possível resolver a URL ou a URL não é válida.');
                return message.channel.send('Não consegui encontrar um link válido!');
            }

            url = resolved.url;
            console.log(`URL resolvida com sucesso: ${url}`);
            message.channel.send(`Coe ${message.author.displayName}, achei essa aqui ${url}. Serve?`);
        }

        try {
            console.log(`Tentando tocar o link: ${url}`);
            // Tocar o link
            await client.distube.play(message.member.voice.channel, url, {
                member: message.member,
                textChannel: message.channel,
                message,
            });
            console.log(`Música tocada com sucesso: ${url}`);
        } catch (error) {
            console.error('Erro ao tentar tocar a música:', error);
            return message.channel.send('Ocorreu um erro ao tentar tocar o link!');
        }

        // Chamar o comando save para armazenar o link
        const saveCommand = client.commands.get('save');
        if (saveCommand) {
            try {
                console.log(`Tentando salvar o link: ${url}`);
                saveCommand.execute(message, client, [url]);
                console.log('Link salvo com sucesso.');
            } catch (e) {
                console.error('Erro ao tentar salvar o link:', e);
                return message.channel.send(`Erro ao tentar salvar o link: \`${e.message}\``);
            }
        }
    },
};
