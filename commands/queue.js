module.exports = {
	name: 'queue',
	aliases: ['q'],
	execute: async (message, client) => {
		const queue = client.distube.getQueue(message);
		if (!queue) {
			return message.channel.send(
				'Não tem nada sendo reproduzido no momento!'
			);
		}
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
