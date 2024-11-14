const { ExtractorPlugin } = require('distube');
const ytdlp = require('@distube/yt-dlp');  // Usado para obter áudio dos vídeos do YouTube
const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config(); // Carrega as variáveis do .env

class MyCustomExtractor extends ExtractorPlugin {
  constructor(options) {
    super(options);
    this.ytdlp = ytdlp;

    // Carrega os cookies do arquivo e os converte para string
    this.cookies = fs.readFileSync(process.env.YOUTUBE_COOKIES, 'utf8').toString();
    
    // Inicializa o OAuth2 Client com as credenciais
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    console.log('MyCustomExtractor initialized');
  }

  // Função para validar a URL
  async validate(url) {
    return url.startsWith('https://www.youtube.com') || url.startsWith('https://youtu.be');
  }

  // Função de extração para pegar o áudio do vídeo
  async extract(url) {
    console.log(`Extracting audio from URL: ${url}`);
    try {
      const info = await this.ytdlp.getInfo(url, {
        username: process.env.YOUTUBE_USERNAME,  // Usar o login se necessário
        password: process.env.YOUTUBE_PASSWORD,  // Usar a senha se necessário
        ytdlpArgs: [
          '--cookies-from-string', this.cookies, // Passa os cookies
          '--no-check-certificate',  // Ignora verificação do certificado
          '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          '--proxy', process.env.PROXY_URL,  // Usar proxy se necessário
        ],
      });

      return {
        name: info.title,
        url: info.webpage_url,
        audioUrl: info.formats.find(f => f.acodec === 'mp4a.40.2' || f.acodec === 'vorbis').url,  // Pegando o URL do áudio
        duration: info.duration,
      };
    } catch (error) {
      console.error('Error extracting audio:', error);
      throw error;
    }
  }

  // Pesquisa se a query é válida ou busca no YouTube
  async resolve(query) {
    if (await this.validate(query)) {
      return {
        name: query,
        url: query,
        audioUrl: query,  // Retorna a URL do vídeo para o comando play
        duration: null,
      };
    } else {
      return await this.search(query);  // Caso não seja URL, realiza a pesquisa
    }
  }

  async search(query) {
    console.log(`Searching for query: ${query}`);
    try {
      const results = await ytsr(query, { limit: 1 });
      const video = results.items.find(item => item.type === 'video');

      if (!video) return null;

      return {
        name: video.name,
        author: video.author.name,
        url: video.url,
        audioUrl: video.url, // Retorna o URL do áudio para o comando play
        duration: null,
      };
    } catch (error) {
      console.error('Error searching for video:', error);
      throw error;
    }
  }
}

module.exports = MyCustomExtractor;
