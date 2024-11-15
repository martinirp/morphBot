const fs = require('fs').promises;
const path = require('path');
const filePath = path.join(__dirname, '..', 'data', 'links.json');
const MyCustomExtractor = require('./../myCustomExtractor');

module.exports = {
    name: 'erase',
    description: 'Apaga uma música do arquivo JSON, se existir.',
    aliases: ['e'],
    execute: async (message, client, args) => {
        const string = args.join(' ');
        if (!string) {
            return message.channel.send('Você precisa fornecer algo para buscar!');
        }

        // Carregar o arquivo JSON
        let linksData;
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            linksData = JSON.parse(fileContent);
            if (linksData.length === 0) {
                return message.channel.send('O arquivo de links está vazio.');
            }
        } catch (error) {
            console.error(`Erro ao carregar o arquivo JSON: ${error}`);
            return message.channel.send('Ocorreu um erro ao carregar o arquivo de links.');
        }

        // Remover o último link salvo (parâmetro "last")
        if (string.toLowerCase() === 'last') {
            const removedEntry = linksData.pop(); // Remove o último item do array
            try {
                await fs.writeFile(filePath, JSON.stringify(linksData, null, 2), 'utf8');
                return message.channel.send(`Última entrada removida com sucesso: ${removedEntry.NAME} - ${removedEntry.ARTIST}`);
            } catch (error) {
                console.error(`Erro ao escrever no arquivo JSON: ${error}`);
                return message.channel.send('Ocorreu um erro ao salvar as alterações.');
            }
        }

        // Verificar se o argumento é um número (índice)
        if (!isNaN(string)) {
            const index = parseInt(string, 10) - 1; // Ajusta o índice para o padrão do array (0-based)
            if (index >= 0 && index < linksData.length) {
                const removedEntry = linksData.splice(index, 1);
                try {
                    await fs.writeFile(filePath, JSON.stringify(linksData, null, 2), 'utf8');
                    return message.channel.send(`Entrada removida com sucesso: ${removedEntry[0].NAME} - ${removedEntry[0].ARTIST}`);
                } catch (error) {
                    console.error(`Erro ao escrever no arquivo JSON: ${error}`);
                    return message.channel.send('Ocorreu um erro ao salvar as alterações.');
                }
            } else {
                return message.channel.send('Índice fora do alcance.');
            }
        }

        // Se não for um índice, tenta remover pelo link
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|playlist\?|channel\/|user\/|c\/)?[A-Za-z0-9_-]+/;
        let url;

        if (youtubeRegex.test(string)) {
            url = string;
        } else {
            const extractor = new MyCustomExtractor();
            const resolved = await extractor.resolve(string);

            if (!resolved || !resolved.url) {
                return message.channel.send('Não consegui encontrar nenhum link para essa busca.');
            }

            url = resolved.url;
        }

        // Verificar se o link existe e removê-lo
        const index = linksData.findIndex(entry => entry.link.includes(url));

        if (index !== -1) {
            const removedEntry = linksData.splice(index, 1);
            try {
                await fs.writeFile(filePath, JSON.stringify(linksData, null, 2), 'utf8');
                message.channel.send(`Link removido com sucesso: ${removedEntry[0].NAME} - ${removedEntry[0].ARTIST}`);
            } catch (error) {
                console.error(`Erro ao escrever no arquivo JSON: ${error}`);
                message.channel.send('Ocorreu um erro ao salvar as alterações.');
            }
        } else {
            message.channel.send('Não encontrei nenhum link correspondente no arquivo.');
        }
    },
};
