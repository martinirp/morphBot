module.exports = {
    name: 'stoploop',
    description: 'tira a musica atual do loop' , 
    aliases: ['sl'],
    inVoiceChannel: true,
    execute: async (message, client) => {
        const queue = client.distube.getQueue(message.guild.id);

        if (!queue || !queue.songs.length) {
            return message.channel.send('Não há nenhuma música na fila para parar o loop!');
        }

        // Parar o loop da música atual
        client.distube.setRepeatMode(message.guild.id, 0); // 0: desativa o loop

        message.channel.send('O loop foi desativado.');
    },
};
