module.exports = {
	name: 'resume',
	description: 'resume o que estava sendo tocado',
	aliases: ['r'],
	inVoiceChannel: true,
	execute: async (message, client) => {
		const queue = client.distube.getQueue(message);
		if (!queue) {
			return message.channel.send(
				'Não tem nada sendo reproduzido no momento!'
			);
		}
		queue.resume();
		message.channel.send('Fila de músicas retomada');
	},
};
