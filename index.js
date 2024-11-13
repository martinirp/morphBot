// Requer as classes necessárias do discord.js
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');

// Obter o caminho do FFmpeg a partir do node_modules
const ffmpeg = require('ffmpeg-static');

// Carregar as variáveis do dotenv
require('dotenv').config();

const { token, COOKIE_FILE_PATH, YTDL_USER_AGENT, YTDL_PROXY, GOOGLE_EMAIL, GOOGLE_PASSWORD } = process.env;
const isDockerDeploy = process.env.DOCKER_DEPLOY === 'true';

// Logar o caminho do arquivo de cookies para verificação
console.log(`Usando cookies de: ${COOKIE_FILE_PATH}`);

// Configuração do Selenium
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

// Configuração dos cookies e cabeçalhos para download do YouTube
const ytDlpOptions = {
    cookieFile: COOKIE_FILE_PATH, 
    userAgent: YTDL_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    proxy: YTDL_PROXY || '', 
    headers: {
        referer: 'https://www.youtube.com/',
    },
};

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
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { DisTube } = require('distube');

// Inicializar DisTube
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

// Função para login com Selenium e confirmação de que o usuário não é um bot
async function loginWithSelenium() {
    // Configurar as opções do Chrome para modo headless e ambientes Docker/CI
    const chromeOptions = new chrome.Options()
        .addArguments('--headless') // Rodar o Chrome em modo headless
        .addArguments('--no-sandbox') // Necessário para alguns ambientes como Docker
        .addArguments('--disable-dev-shm-usage') // Resolves problemas com memória compartilhada
        .addArguments('--remote-debugging-port=9222'); // Habilita o depurador remoto, se necessário

    // Inicializar o WebDriver sem a necessidade de usar o ServiceBuilder
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        await driver.get('https://accounts.google.com/');
        
        // Preencher o e-mail
        await driver.findElement(By.id('identifierId')).sendKeys(GOOGLE_EMAIL, Key.RETURN);
        await driver.wait(until.elementLocated(By.name('password')), 10000);
        
        // Preencher a senha
        await driver.findElement(By.name('password')).sendKeys(GOOGLE_PASSWORD, Key.RETURN);
        
        // Verificar a tela de login ou bot
        await driver.wait(until.elementLocated(By.id('avatar-btn')), 10000);
        console.log('Login realizado com sucesso!');
    } finally {
        await driver.quit();
    }
}

// Chamar loginWithSelenium antes de iniciar o cliente do Discord
loginWithSelenium().catch(console.error);

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
