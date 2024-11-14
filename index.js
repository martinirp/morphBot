// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { spawn } = require('child_process');
const ytdl = require('ytdl-core'); // Para pegar o áudio do YouTube
const ffmpeg = require('ffmpeg-static'); // Para manipular o áudio com ffmpeg

// Load dotenv variables
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;

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

// Quando o cliente estiver pronto, inicie o bot
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Função para tocar música com ffmpeg
const playWithFFmpeg = async (message, url) => {
  // Verifica se o usuário está em um canal de voz
  if (!message.member.voice.channel) {
    return message.channel.send('You need to join a voice channel first!');
  }

  // Conecta no canal de voz
  const connection = await message.member.voice.channel.join();

  // Obtém o stream de áudio do YouTube
  const stream = ytdl(url, { filter: 'audioonly' });

  // Cria um processo ffmpeg para converter o áudio
  const audio = connection.play(stream.pipe(ffmpeg(), { seek: 0, volume: 1 }));

  audio.on('finish', () => {
    console.log('Audio finished playing!');
    connection.disconnect();
  });

  audio.on('error', (error) => {
    console.error('Error playing audio:', error);
    connection.disconnect();
  });

  message.channel.send('Now playing the requested song!');
};

// Exemplo de interação para comandos de prefixo
client.on('messageCreate', async (message) => {
  const prefix = "'";

  if (message.author.bot || !message.guild) return;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === 'play') {
    // Pega o URL do YouTube
    const url = args[0];
    if (!ytdl.validateURL(url)) {
      return message.channel.send('Please provide a valid YouTube URL.');
    }

    // Chama a função que vai tocar a música
    await playWithFFmpeg(message, url);
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
