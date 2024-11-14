// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

// Get FFmpeg path from node_modules
const ffmpeg = require('ffmpeg-static');

// Load dotenv variables
require('dotenv').config();

const { token } = process.env.DISCORD_TOKEN;
const isDockerDeploy = process.env.DOCKER_DEPLOY === 'true';

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

client.commands = new Collection();
client.aliases = new Collection();

client.slashCommands = new Collection();

// Register prefix commands
const registerCommands = require('./registers/commands-register');
registerCommands(client);

// Register slash commands
const registerSlashCommands = require('./registers/slash-commands-register');
registerSlashCommands(client);

// DISTUBE

// DISTUBE PLUGINS
// const { SpotifyPlugin } = require('@distube/spotify');
// const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const { DisTube } = require('distube');

if (isDockerDeploy) {
	client.distube = new DisTube(client, {
		// leaveOnStop: true, -- Não existe essa option mais https://distube.js.org/types/DisTubeOptions.html
		// leaveOnEmpty: true, -- Não existe essa option mais https://distube.js.org/types/DisTubeOptions.html
		// leaveOnFinish: true, -- Não existe essa option mais https://distube.js.org/types/DisTubeOptions.html
		emitNewSongOnly: true,
		emitAddSongWhenCreatingQueue: false,
		emitAddListWhenCreatingQueue: false,
		savePreviousSongs: true,
		nsfw: true,
		plugins: [
			// new SpotifyPlugin({}), -- Desativei o plugin pois nao estava usando
			// new SoundCloudPlugin(), -- Desativei o plugin pois nao estava usando
			new YtDlpPlugin(),
		],
	});
} else {
	client.distube = new DisTube(client, {
		// leaveOnStop: false, -- Não existe essa option mais https://distube.js.org/types/DisTubeOptions.html
		// leaveOnEmpty: false, -- Não existe essa option mais https://distube.js.org/types/DisTubeOptions.html
		// leaveOnFinish: false, -- Não existe essa option mais https://distube.js.org/types/DisTubeOptions.html
		emitNewSongOnly: true,
		emitAddSongWhenCreatingQueue: false,
		emitAddListWhenCreatingQueue: false,
		savePreviousSongs: true,
		nsfw: true,
		plugins: [
			// new SpotifyPlugin({}), -- Desativei o plugin pois nao estava usando
			// new SoundCloudPlugin(), -- Desativei o plugin pois nao estava usando
			new YtDlpPlugin(),
		],
		ffmpeg: {
			path: ffmpeg,
		},
	});
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on('messageCreate', async (message) => {
	const prefix = "'";

	if (message.author.bot || !message.guild) return;

	if (!message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const commandTyped = args.shift().toLowerCase();

	const cmd =
		client.commands.get(commandTyped) ||
		client.commands.get(client.aliases.get(commandTyped));

	if (!cmd) return;

	if (cmd.inVoiceChannel && !message.member.voice.channel) {
		return message.channel.send(
			`${client.error} | You must be in a voice channel!`
		);
	}

	try {
		await cmd.execute(message, client, args);
	} catch (e) {
		console.error(e);
		message.channel.send(`${client.emotes.error} | Error: \`${e}\``);
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.slashCommands.get(
		interaction.commandName
	);

	if (!command) {
		console.error(
			`No command matching ${interaction.commandName} was found.`
		);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	}
});

// Log in to Discord with your client's token
client.login(token);
