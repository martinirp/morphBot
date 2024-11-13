const fs = require('fs');  // Adicione esta linha para importar o módulo fs
const MyCustomExtractor = require('./../myCustomExtractor');
const { Client, Message } = require('discord.js');
const { exec } = require('child_process');

// Caminho para o arquivo links.txt
const path = require('path');
const filePath = path.join(__dirname, '..', 'data', 'links.txt');

// Função para salvar o link no arquivo
function saveLink(link) {
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

        // Parte para usar os cookies com yt-dlp (caso esteja configurado)
        const ytDlpPath = path.join(__dirname, 'yt-dlp'); // Certifique-se de que o yt-dlp está no caminho correto ou forneça o caminho absoluto
        const cookiesPath = path.join(__dirname, '..', 'data', 'cookies.txt');

        // Verifica se os cookies estão no caminho correto e se o arquivo existe
        const cookiesExist = fs.existsSync(cookiesPath);
        if (cookiesExist) {
            // Comando para rodar o yt-dlp com os cookies
            exec(`${ytDlpPath} --cookies ${cookiesPath} ${url}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao rodar yt-dlp: ${error.message}`);
                    return message.channel.send('Erro ao tentar baixar o conteúdo.');
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return message.channel.send('Erro ao tentar baixar o conteúdo.');
                }
                console.log(`stdout: ${stdout}`);
            });
        } else {
            message.channel.send('Não encontrei cookies para autenticação. Verifique o arquivo "cookies.txt".');
        }

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
