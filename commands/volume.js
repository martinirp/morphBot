module.exports = {
	name: 'volume',
	description: 'altera o volume do bot',
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

		if (volume < 0 || volume > 100) {
			return message.channel.send('Você quer me deixar surdo??');
		}

		if (volume < 10){
			return message.channel.send('Tá baixo demais!');
		}

		client.distube.setVolume(message, volume);
	},
};
