const fs = require('fs');
const path = require('path');
const axios = require('axios');

const filePath = path.join(__dirname, '..', 'data', 'links.json');
const API_KEY = 'Sua_chave_de_API_aqui';

module.exports = {
    name: 'update',
    description: 'Atualiza o arquivo JSON com informações dos links e remove duplicatas',
    async execute(message) {
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

        // Remove duplicatas
        const uniqueLinks = [];
        const uniqueSet = new Set();

        for (const entry of links) {
            if (!uniqueSet.has(entry.link[0])) {
                uniqueLinks.push(entry);
                uniqueSet.add(entry.link[0]);
            }
        }

        // Atualiza o arquivo JSON com links únicos
        try {
            fs.writeFileSync(filePath, JSON.stringify(uniqueLinks, null, 2), 'utf8');
            console.log('Biblioteca atualizada e duplicatas removidas.');

            // Envia mensagem de confirmação para o Discord
            if (message && message.channel) {
                message.channel.send('Biblioteca atualizada.');
            }
        } catch (error) {
            console.error(`Erro ao escrever no arquivo JSON: ${error}`);
        }
    },
};
