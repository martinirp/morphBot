import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import ffmpeg from 'ffmpeg-static'; // Usando o import
import dotenv from 'dotenv'; // Usando dotenv com import
import { YtDlpPlugin } from '@distube/yt-dlp';
import { DisTube } from 'distube';
import registerCommands from './registers/commands-register.js';
import registerSlashCommands from './registers/slash-commands-register.js';
import mentionCommand from './commands/mention.js';

// Carregar variáveis de ambiente
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const isDockerDeploy = process.env.DOCKER_DEPLOY === 'true';

// Caminho para o arquivo de cookies
const cookiesFilePath = process.env.COOKIE_FILE_PATH || './data/cookies.txt';

// Criar uma nova instância do cliente Discord
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

// Registrar comandos de prefixo
await registerCommands(client);

// Registrar comandos de barra
await registerSlashCommands(client);

// Configurar o DisTube
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

// Tratar erros do DisTube
client.distube.on('error', async (channel, error) => {
    try {
        if (error.name === 'YTDLP_ERROR' && error.message.includes('Sign in to confirm your age')) {
            await channel.send('Este vídeo requer confirmação de idade e não pode ser reproduzido.');
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

// Quando o cliente estiver pronto, execute esse código (uma vez)
client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Registrar o comando de menção
client.on('messageCreate', async (message) => {
    const prefix = "'";

    if (message.author.bot || !message.guild) return;

    if (message.mentions.has(client.user)) {
        if (mentionCommand) {
            try {
                await mentionCommand.execute(message, client);
            } catch (e) {
                console.error(e);
                message.channel.send(`Erro ao executar o comando: \`${e.message}\``);
            }
        }
        return;
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandTyped = args.shift().toLowerCase();

    const cmd =
        client.commands.get(commandTyped) ||
        client.commands.get(client.aliases.get(commandTyped));

    if (!cmd) return;

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

    const command = interaction.client.slashCommands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
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

// Fazer login no Discord com o token do cliente
client.login(token);
