module.exports = {
    name: 'clear',
    description: 'Limpa a fila de músicas e exibe a fila atualizada',
    aliases: ['c'],
    execute: async (message, client) => {
        const queue = client.distube.getQueue(message);
        if (!queue) {
            return message.channel.send('Não tem nada sendo reproduzido no momento!');
        }

        // Limpa a fila, mas mantém a música atual
        queue.songs = queue.songs.slice(0, 1);

        message.channel.send('A fila foi limpa!');

        // Executa o comando queue para mostrar a fila atualizada
        const queueCommand = require('./queue');
        queueCommand.execute(message, client);
    },
};
