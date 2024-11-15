module.exports = {
    name: 'remove',
    description: 'Remove uma música da fila pelo índice e exibe a fila atualizada',
    aliases: ['r'],
    execute: async (message, client, args) => {
        const queue = client.distube.getQueue(message);
        if (!queue) {
            return message.channel.send('Não tem nada sendo reproduzido no momento!');
        }

        const index = parseInt(args[0], 10);
        if (isNaN(index) || index < 1 || index >= queue.songs.length) {
            return message.channel.send('Por favor, forneça um índice válido.');
        }

        // Remove a música da fila
        const removedSong = queue.songs.splice(index, 1)[0];
        message.channel.send(`Removido: **${removedSong.name}** da fila.`);

        // Executa o comando queue para mostrar a fila atualizada
        const queueCommand = require('./queue');
        queueCommand.execute(message, client);
    },
};
