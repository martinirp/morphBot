// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

// Get FFmpeg path from node_modules
const ffmpeg = require('ffmpeg-static');

// Load dotenv variables
require('dotenv').config();

const { token, COOKIE_FILE_PATH, YTDL_USER_AGENT, YTDL_PROXY, GOOGLE_EMAIL, GOOGLE_PASSWORD } = process.env;
const isDockerDeploy = process.env.DOCKER_DEPLOY === 'true';

// Log the cookie file path for verification
console.log(`Using cookies from: ${COOKIE_FILE_PATH}`);

// Selenium setup
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Configure cookies and headers for YouTube download
const ytDlpOptions = {
    cookieFile: COOKIE_FILE_PATH, 
    userAgent: YTDL_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    proxy: YTDL_PROXY || '', 
    headers: {
        referer: 'https://www.youtube.com/',
    },
};

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

// Initialize DisTube
if (isDockerDeploy) {
    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        savePreviousSongs: true,
        nsfw: true,
        plugins: [
            new YtDlpPlugin(ytDlpOptions),
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
            new YtDlpPlugin(ytDlpOptions),
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

// Function to login with Selenium and confirm that the user is not a bot
async function loginWithSelenium() {
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();
    try {
        await driver.get('https://accounts.google.com/');
        
        // Fill in email
        await driver.findElement(By.id('identifierId')).sendKeys(GOOGLE_EMAIL, Key.RETURN);
        await driver.wait(until.elementLocated(By.name('password')), 10000);
        
        // Fill in password
        await driver.findElement(By.name('password')).sendKeys(GOOGLE_PASSWORD, Key.RETURN);
        
        // Handle bot check or login
        await driver.wait(until.elementLocated(By.id('avatar-btn')), 10000);
        console.log('Login realizado com sucesso!');
    } finally {
        await driver.quit();
    }
}

// Call loginWithSelenium before starting Discord client
loginWithSelenium().catch(console.error);

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Register the mention command
const mentionCommand = require('./commands/mention'); 

client.on('messageCreate', async (message) => {
    const prefix = "'";

    if (message.author.bot || !message.guild) return;

    // Check if bot was mentioned
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

// Log in to Discord with your client's token
client.login(token);
