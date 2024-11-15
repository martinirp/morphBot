module.exports = {
	name: 'skip',
	description: 'pula a musica atual e avança para a próxima',
	aliases: ['sk'],
	inVoiceChannel: true,
	execute: async (message, client) => {
		const queue = client.distube.getQueue(message);

		if (!queue) {
			return message.channel.send(
				'Não tem nada sendo reproduzido no momento!'
			);
		}

		if (queue?.songs?.length === 1) {
			return message.channel.send('Não tem mais música na fila filhão!');
		}

		try {
			const song = await queue.skip();
			message.channel.send(`Skipped! Now playing:\n${song.name}`);
		} catch (e) {
			message.channel.send(`${e}`);
		}
	},
};
