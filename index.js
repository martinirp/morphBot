const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const ffmpeg = require('ffmpeg-static');
require('dotenv').config();

const { token } = process.env.DISCORD_TOKEN;
const isDockerDeploy = process.env.DOCKER_DEPLOY === 'true';

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

// Registrar comandos
const registerCommands = require('./registers/commands-register');
registerCommands(client);

// Registrar comandos de barra
const registerSlashCommands = require('./registers/slash-commands-register');
registerSlashCommands(client);

// Configurar o cliente do DisTube
if (isDockerDeploy) {
    client.distube = new DisTube(client, {
        leaveOnFinish: true,
        leaveOnStop: false,
        nsfw: true,
        plugins: [
            new YtDlpPlugin(),
        ],
    });
} else {
    client.distube = new DisTube(client, {
        leaveOnFinish: true,
        leaveOnStop: false,
        nsfw: true,
        plugins: [
            new YtDlpPlugin(),
        ],
        ffmpeg: {
            path: ffmpeg,
        },
    });
}

// Quando o cliente estiver pronto
client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Monitorando mensagens
client.on('messageCreate', async (message) => {
    const prefix = '!';
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandTyped = args.shift().toLowerCase();

    const cmd = client.commands.get(commandTyped) || client.commands.get(client.aliases.get(commandTyped));
    if (!cmd) return;

    if (cmd.inVoiceChannel && !message.member.voice.channel) {
        return message.channel.send(`${client.error} | Você precisa estar em um canal de voz!`);
    }

    try {
        await cmd.execute(message, client, args);
    } catch (e) {
        console.error(e);
        message.channel.send(`${client.emotes.error} | Error: \`${e}\``);
    }
});

// Monitorando interações de comandos de barra
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.slashCommands.get(interaction.commandName);
    if (!command) {
        console.error(`Comando ${interaction.commandName} não encontrado.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'Houve um erro ao executar esse comando!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: 'Houve um erro ao executar esse comando!',
                ephemeral: true,
            });
        }
    }
});

// Logar no Discord
client.login(token);
