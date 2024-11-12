// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

// Get FFmpeg path from node_modules
const ffmpeg = require('ffmpeg-static');

// Load dotenv variables
require('dotenv').config();

const { token } = process.env.DISCORD_TOKEN;
const isDockerDeploy = process.env.DOCKER_DEPLOY === 'true';

// Path to cookies file (Assuming 'data' folder is at the root of the bot project)
const cookiesFilePath = process.env.COOKIE_FILE_PATH || './data/cookies.txt'; // Get cookies path from env

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
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { DisTube } = require('distube');

if (isDockerDeploy) {
    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        savePreviousSongs: true,
        nsfw: true,
        plugins: [
            new YtDlpPlugin({ cookies: cookiesFilePath }),
        ],
    });
} else {
    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        savePreviousSongs: true,
        nsfw: true,
        plugins: [
            new YtDlpPlugin({ cookies: cookiesFilePath }),
        ],
        ffmpeg: {
            path: ffmpeg,
        },
    });
}

// Handle DisTube errors, including age restriction
client.distube.on('error', async (channel, error) => {
    try {
        if (error.name === 'YTDLP_ERROR' && error.message.includes('Sign in to confirm your age')) {
            // Send a message if age confirmation is required
            await channel.send('Este vídeo requer confirmação de idade e não pode ser reproduzido.');
            
            // Get the queue and skip the current song if it's active
            const queue = client.distube.getQueue(channel);
            if (queue) await queue.skip();
        } else {
            console.error(`Erro de DisTube: ${error.message}`);
            await channel.send('Ocorreu um erro ao tentar reproduzir o vídeo.');
        }
    } catch (e) {
        console.error(`Erro ao lidar com erro do DisTube: ${e.message}`);
        await channel.send('Ocorreu um erro inesperado ao lidar com a reprodução.');
    }
});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Register the mention command
const mentionCommand = require('./commands/mention'); // Ajuste o caminho se necessário

client.on('messageCreate', async (message) => {
    const prefix = "'";

    if (message.author.bot || !message.guild) return;

    // Verifica se o bot foi mencionado
    if (message.mentions.has(client.user)) {
        if (mentionCommand) {
            try {
                await mentionCommand.execute(message, client);
            } catch (e) {
                console.error(e);
                message.channel.send(`Erro ao executar o comando: \`${e.message}\``);
            }
        }
        return; // Evita que o código abaixo seja executado se o bot for mencionado
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandTyped = args.shift().toLowerCase();

    const cmd =
        client.commands.get(commandTyped) ||
        client.commands.get(client.aliases.get(commandTyped));

    if (!cmd) return;

    // Verificação de permissão no canal de voz
    if (cmd.inVoiceChannel && !message.member.voice.channel) {
        return message.channel.send('Você deve estar em um canal de voz!');
    }

    try {
        await cmd.execute(message, client, args);
    } catch (e) {
        console.error(e);
        message.channel.send(`Erro: \`${e.message}\``);
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
