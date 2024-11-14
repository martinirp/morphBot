// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { spawn } = require('child_process');

// Get FFmpeg path from node_modules
const ffmpeg = require('ffmpeg-static');

// Load dotenv variables
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
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

// DISTUBE (com suporte nativo ao Lavalink)
const { DisTube } = require('distube');
const { LavalinkPlugin } = require('@distube/lavalink');

// Configuração do Lavalink
const lavalinkNodes = [
  {
    host: 'localhost',   // Endereço do servidor Lavalink
    port: 2333,          // Porta padrão do Lavalink
    password: 'youshallnotpass', // Senha configurada no seu Lavalink
    secure: false,       // False se não estiver usando HTTPS
  },
];

// Inicializa o servidor Lavalink a partir da pasta correta
if (!isDockerDeploy) {
  console.log('Starting Lavalink server...');
  const lavalinkProcess = spawn('java', ['-jar', '/home/ubuntu/lavalink/Lavalink.jar'], {
    cwd: '/home/ubuntu/lavalink', // Diretório onde o Lavalink.jar está localizado
    stdio: 'inherit',
  });

  lavalinkProcess.on('error', (err) => {
    console.error('Failed to start Lavalink:', err);
    process.exit(1);
  });

  lavalinkProcess.on('close', (code) => {
    console.log(`Lavalink process exited with code ${code}`);
    process.exit(code);
  });
}

// Inicialização do DisTube
client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  savePreviousSongs: true,
  nsfw: true,
});

// Adicionar o plugin Lavalink ao DisTube
client.distube.plugins.push(
  new LavalinkPlugin({
    nodes: lavalinkNodes, // Passando a configuração do Lavalink diretamente aqui
  })
);

// Quando o cliente estiver pronto, inicie o bot
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  client.distube.on('connect', (queue) => {
    console.log(`Connected to Lavalink for: ${queue.guild.name}`);
  });
});

// Exemplo de interação para comandos de prefixo
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

// Exemplo de interação para comandos slash
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
