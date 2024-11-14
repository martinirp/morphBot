// Requer as classes necessárias do discord.js
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

// Obter o caminho do FFmpeg a partir do node_modules
const ffmpeg = require('ffmpeg-static');

// Carregar as variáveis do dotenv
require('dotenv').config();

const { token } = process.env;

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

// Registrar comandos com prefixo
const registerCommands = require('./registers/commands-register');
registerCommands(client);

// Registrar comandos de barra
const registerSlashCommands = require('./registers/slash-commands-register');
registerSlashCommands(client);

// DISTUBE
const { DisTube } = require('distube');
const ytdl = require('youtube-dl-exec'); // Importa o youtube-dl-exec

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    savePreviousSongs: true,
    nsfw: true,
    ffmpeg: {
        path: ffmpeg,
    },
});

// Quando o cliente estiver pronto, executar este código (apenas uma vez)
client.once(Events.ClientReady, (c) => {
    console.log(`Pronto! Conectado como ${c.user.tag}`);
});

// Registrar o comando mention
const mentionCommand = require('./commands/mention');

client.on('messageCreate', async (message) => {
    const prefix = "'";

    if (message.author.bot || !message.guild) return;

    // Verificar se o bot foi mencionado
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

    const command = interaction.client.slashCommands.get(
        interaction.commandName
    );

    if (!command) {
        console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'Ocorreu um erro ao executar este comando!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: 'Ocorreu um erro ao executar este comando!',
                ephemeral: true,
            });
        }
    }
});

// Logar no Discord com o token do seu cliente
client.login(token);
