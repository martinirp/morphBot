module.exports = {
	name: 'ping',
	aliases: ['ye'],
	inVoiceChannel: false,
	execute: async (message) => {
		message.channel.send(`Hi ${message.author.username} :)`);
	},
};
