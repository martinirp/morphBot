const fs = require('fs');
const path = require('path');
const axios = require('axios');

const filePath = path.join(__dirname, '..', 'data', 'links.json');
const API_KEY = 'AIzaSyC2LtwuJWKtZLMEiVlhEaFSGcxYGYNHuoA'; // Substitua com sua chave de API

module.exports = {
    name: 'save',
    description: 'Salva um link no arquivo JSON com informações adicionais',
    async execute(message, client, link) {
        if (!link) {
            console.log('Nenhum link fornecido.');
            return;
        }

        let links = [];

        // Verifica se o arquivo existe e lê o conteúdo
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                links = JSON.parse(data);
                if (!Array.isArray(links)) {
                    links = [];
                }
            } catch (error) {
                console.error(`Erro ao ler o arquivo JSON: ${error}`);
                return;
            }
        }

        // Checa se o link já está no arquivo
        const normalizedLink = new URL(link).toString();
        if (links.some(entry => entry.link.includes(normalizedLink))) {
            console.log('Esse link já existe na biblioteca.');
            return;
        }

        // Adiciona informações adicionais
        const videoId = new URL(link).searchParams.get('v');
        let name = '';
        let artist = '';

        if (videoId) {
            try {
                const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
                const response = await axios.get(apiUrl);
                if (response.data.items.length > 0) {
                    const snippet = response.data.items[0].snippet;
                    name = snippet.title;
                    artist = snippet.channelTitle;
                }
            } catch (error) {
                console.error(`Erro ao obter dados do vídeo: ${error}`);
            }
        }

        const newEntry = {
            link: [normalizedLink], // Mantenha o link como uma lista
            user: message.author.displayName,
            date: new Date().toISOString(),
            NAME: name,
            ARTIST: artist
        };

        links.push(newEntry);

        // Remove entradas duplicadas
        const uniqueLinks = [];
        const seenLinks = new Set();

        for (const entry of links) {
            const linkString = entry.link[0];
            if (!seenLinks.has(linkString)) {
                seenLinks.add(linkString);
                uniqueLinks.push(entry);
            }
        }

        // Escreve os dados no arquivo JSON
        try {
            fs.writeFileSync(filePath, JSON.stringify(uniqueLinks, null, 2), 'utf8');
            console.log(`Link adicionado ao arquivo JSON: ${link}`);
        } catch (error) {
            console.error(`Erro ao escrever no arquivo JSON: ${error}`);
        }
    },
};
