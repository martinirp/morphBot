module.exports = {
	name: 'ping',
	description: 'retorna pong',
	aliases: ['ping'],
	inVoiceChannel: false,
	execute: async (message) => {
		message.channel.send(`pong`);
	},
};
