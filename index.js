// Requer as classes necessárias do discord.js
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

// Carregar o caminho do FFmpeg de ffmpeg-static
const ffmpeg = require('ffmpeg-static');

// Carregar as variáveis do arquivo .env
require('dotenv').config();

const { token } = process.env.DISCORD_TOKEN;
const isDockerDeploy = process.env.DOCKER_DEPLOY === 'true';

// Carregar DisTube e YtDlpPlugin
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

// Criar uma nova instância do cliente
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

// Registrar os comandos de prefixo
const registerCommands = require('./registers/commands-register');
registerCommands(client);

// Registrar os comandos de barra
const registerSlashCommands = require('./registers/slash-commands-register');
registerSlashCommands(client);

// Usar @discordjs/voice para conexão de áudio com Discord
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, AudioPlayer } = require('@discordjs/voice');

// Configuração do bot no Docker ou não
if (isDockerDeploy) {
    // Configuração específica para quando o bot está sendo executado no Docker
    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        savePreviousSongs: true,
        nsfw: true,
        plugins: [
            new YtDlpPlugin(),
        ],
    });
} else {
    // Configuração padrão para quando o bot não está no Docker
    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        savePreviousSongs: true,
        nsfw: true,
        plugins: [
            new YtDlpPlugin(),
        ],
        ffmpeg: {
            path: ffmpeg,  // Caminho para o ffmpeg se não estiver no Docker
        },
    });
}

// Quando o cliente estiver pronto, rodar este código
client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Monitorando mensagens e interações
client.on('messageCreate', async (message) => {
    const prefix = '!';

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

// Monitorando interações de comandos de barra
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

// Logar no Discord com o token do cliente
client.login(token);
