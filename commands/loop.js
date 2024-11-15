module.exports = {
    name: 'loop',
	description: 'Coloca a musica que está sendo tocada em loop',
    aliases: ['l'],
    inVoiceChannel: true,
    execute: async (message, client) => {
        const queue = client.distube.getQueue(message.guild.id);

        if (!queue || !queue.songs.length) {
            return message.channel.send('Não há nenhuma música na fila para colocar em loop!');
        }

        // Definindo o modo de repetição da música atual
        const song = queue.songs[0]; // A música que está tocando
        client.distube.setRepeatMode(message.guild.id, 1); // 1: loop da música atual

        message.channel.send(`A música "${song.name}" está agora em loop.`);
    },
};
