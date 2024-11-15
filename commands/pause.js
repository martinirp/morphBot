module.exports = {
	name: 'pause',
	description: 'pausa o que está sendo tocado',
	aliases: ['p'],
	inVoiceChannel: true,
	execute: async (message, client) => {
		const queue = client.distube.getQueue(message);
		if (!queue) {
			return message.channel.send(
				'Não tem nada sendo reproduzido no momento!'
			);
		}
		if (!queue.paused) {
			queue.pause();
			message.channel.send('Fila de músicas pausada');
		}
	},
};
