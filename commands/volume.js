module.exports = {
	name: 'volume',
	aliases: ['vol'],
	inVoiceChannel: true,
	execute: async (message, client, args) => {
		const volume = +args;

		if (typeof volume != 'number') {
			return message.channel.send('Isso não é um volume válido');
		}

		const queue = client.distube.getQueue(message);

		if (!queue) {
			return message.channel.send('Não tem nada na fila');
		}

		if (volume < 0 || volume > 200) {
			return message.channel.send('Calma la meu patrão');
		}

		client.distube.setVolume(message, volume);
	},
};
