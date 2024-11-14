const { ExtractorPlugin } = require('distube');
const ytsr = require('@distube/ytsr');
const ytdlp = require('@distube/yt-dlp');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config(); // Carrega as variáveis do .env

class MyCustomExtractor extends ExtractorPlugin {
  constructor(options) {
    super(options);
    this.ytdlp = ytdlp;
    this.ytsr = ytsr;
    
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

  // Função para gerar a URL de autorização do Google OAuth2
  generateAuthUrl() {
    const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Para obter um token de atualização
      scope: SCOPES,
    });
  }

  // Função para trocar o código de autorização por tokens de acesso
  async getAccessToken(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      // Salve os tokens em um arquivo para usar mais tarde, se necessário
      fs.writeFileSync('tokens.json', JSON.stringify(tokens));
      console.log('Tokens obtidos com sucesso');
      return tokens;
    } catch (error) {
      console.error('Erro ao trocar o código por tokens:', error);
      throw error;
    }
  }

  // Função para obter o token de acesso armazenado no arquivo
  async getStoredToken() {
    try {
      const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
      this.oauth2Client.setCredentials(tokens);
      console.log('Tokens carregados do arquivo');
      return tokens;
    } catch (error) {
      console.error('Erro ao carregar os tokens armazenados:', error);
      throw error;
    }
  }

  async validate(url) {
    console.log(`Validating URL: ${url}`);
    const isValid =
      url.startsWith('https://') &&
      (url.includes('youtube.com') || url.includes('youtu.be'));
    return isValid;
  }

  async extract(url) {
    console.log(`Extracting from URL: ${url}`);
    try {
      const info = await this.ytdlp.getInfo(url, {
        username: process.env.YOUTUBE_USERNAME, // Usa o login se necessário
        password: process.env.YOUTUBE_PASSWORD, // Usa a senha se necessário
        ytdlpArgs: [
          '--cookies-from-string',
          this.cookies, // Passa os cookies diretamente
          '--no-check-certificate', // Adiciona o parâmetro para não verificar o certificado
          '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Modifica o User-Agent
          '--proxy', process.env.PROXY_URL, // Configura proxy se necessário
        ],
      });
      return {
        name: info.title,
        url: info.webpage_url,
        thumbnail: info.thumbnail,
        duration: info.duration,
      };
    } catch (error) {
      console.error('Error extracting info:', error);
      throw error;
    }
  }

  async search(query) {
    console.log(`Searching for query: ${query}`);
    try {
      const results = await ytsr(query, { limit: 1 });

      const video = results.items.find((item) => item.type === 'video');

      return video
        ? {
            name: video.name,
            author: video.author.name,
            url: video.url,
            thumbnail: video.thumbnail,
            duration: null, // Duração pode ser obtida adicionalmente com yt-dlp se necessário
          }
        : null;
    } catch (error) {
      console.error('Error searching for video:', error);
      throw error;
    }
  }

  async resolve(query) {
    console.log(`Resolving query: ${query}`);

    if (await this.validate(query)) {
      console.log('Query is a valid URL');
      return {
        name: query, // Pode ser alterado se você quiser um nome diferente
        url: query,
        thumbnail: null,
        duration: null,
      };
    } else {
      console.log('Query is not a URL, performing search');
      return await this.search(query);
    }
  }

  // Função para acessar a API do YouTube com OAuth2
  async accessYouTubeAPI() {
    try {
      const youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
      const response = await youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        mine: true,
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao acessar dados do YouTube:', error);
      throw error;
    }
  }
}

module.exports = MyCustomExtractor;
