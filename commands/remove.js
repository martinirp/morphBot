module.exports = {
	name: 'remove',
	aliases: ['r'],
	execute: async (message, client, args) => {
		const index = +args;

		if (typeof index != 'number') {
			return message.channel.send('Esse não é um índice válido');
		}

		const queue = client.distube.getQueue(message);

		if (!queue) {
			return message.channel.send(
				'Não tem nada sendo reproduzido no momento!'
			);
		}

		if (!queue.songs.at(index)) {
			return message.channel.send('Não tem uma música nesse indice');
		}

		queue.songs = queue.songs.splice(index, 1);

		const q = queue.songs
			.map(
				(song, i) =>
					`${i === 0 ? 'Playing:' : `${i}.`} ${song.name} - \`${
						song.formattedDuration
					}\``
			)
			.join('\n');

		message.channel.send(`**Server Queue**\n${q}`);
	},
};
