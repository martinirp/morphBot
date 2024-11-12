const { SearchResultType } = require('distube');

module.exports = {
	name: 'play-link',
	aliases: ['pl'],
	inVoiceChannel: true,
	execute: async (message, client, args) => {
		const string = args.join(' ');
		if (!string) {
			return message.channel.send(
				'Entre com um valor válido para pesquisa.'
			);
		}

		const youtubeRegex =
			/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|playlist\?|channel\/|user\/|c\/)?[A-Za-z0-9_-]+/;

		if (!youtubeRegex.test(string)) {
			return message.channel.send('Não é um link do Youtube');
		}

		client.distube.play(message.member.voice.channel, string, {
			member: message.member,
			textChannel: message.channel,
			message,
		});
	},
};
