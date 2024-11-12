const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const filePath = path.join(__dirname, '..', 'data', 'links.json');

module.exports = {
    name: 'mention',
    description: 'Faz um mix de 10 musicas armazenadas na biblioteca',
    async execute(message, client) {
        if (!fs.existsSync(filePath)) {
            console.log('Arquivo JSON não encontrado.');
            return;
        }

        let links = [];

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

        if (links.length === 0) {
            console.log('Nenhum link encontrado no arquivo JSON.');
            return;
        }

        // Calcula 10% do número de músicas e arredonda para cima
        const numberOfSongs = 10;

        for (let i = 0; i < numberOfSongs; i++) {
            const randomIndex = Math.floor(Math.random() * links.length);
            const chosenLink = links[randomIndex].link;
            const user = links[randomIndex].user;
            const date = new Date(links[randomIndex].date);
            const formattedDate = format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR });

            try {
                await client.commands.get('play-link').execute(message, client, [chosenLink]);

                const responseMessage = `
🎵 **Tocando uma música aleatória:**
[${chosenLink}](${chosenLink})

**Escolhido por:** ${user}
**Data e Hora:** ${formattedDate}
                `.trim();

                await message.channel.send(responseMessage);

                console.log(`🎵 Tocando uma música aleatória: ${chosenLink}`);
                console.log(`Escolhido por ${user} em ${formattedDate}`);

                // Adiciona um delay de 1 segundo entre as músicas
                if (i < numberOfSongs - 1) { // Evita o delay após a última música
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } catch (error) {
                console.error(`Erro ao executar o comando play-link: ${error}`);
            }
        }
    },
};
