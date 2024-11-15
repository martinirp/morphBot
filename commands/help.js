const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Lista todos os comandos disponíveis',
    aliases: ['h'],
    execute: async (message, client) => {
        // Caminho para a pasta de comandos
        const commandsPath = path.join(__dirname, '../commands');
        
        // Ler todos os arquivos na pasta de comandos
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        // Criar uma lista de comandos
        let helpMessage = 'Aqui estão os comandos disponíveis:\n\n';
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            helpMessage += `__${command.name}__ -> **${command.aliases}** : ${command.description || 'Sem descrição.'}\n`;
        }
        
        // Enviar a mensagem de ajuda
        message.channel.send(helpMessage);
    },
};
