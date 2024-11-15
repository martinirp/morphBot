const { ExtractorPlugin } = require('distube');
const ytsr = require('ytsr');
const ytdlp = require('@distube/yt-dlp');

class MyCustomExtractor extends ExtractorPlugin {
    constructor(options) {
        super(options);
        this.ytdlp = ytdlp;
        this.ytsr = ytsr;
        console.log('MyCustomExtractor initialized');
    }

    async validate(url) {
        console.log(`Validating URL: ${url}`);
        return (
            url.startsWith('https://') ||
            url.includes('youtube.com') ||
            url.includes('youtu.be')
        );
    }

    async extract(url) {
        console.log(`Extracting from URL: ${url}`);
        try {
            const info = await this.ytdlp.getInfo(url);
            return {
                name: info.title,
                url: info.webpage_url,
                thumbnail: info.thumbnail,
                duration: info.duration,
            };
        } catch (error) {
            console.error('Error extracting info:', error);
            throw error; // Apenas lança o erro sem tratamento específico
        }
    }

    async search(query) {
        console.log(`Searching for query: ${query}`);
        try {
            const results = await ytsr(query, { limit: 1 });
            const video = results.items.find((item) => item.type === 'video');
            return video
                ? {
                    name: video.title,
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

    async searchRelated(query, limit = 5) {
        console.log(`Searching for related videos for query: ${query}`);
        try {
            // Primeiro, busca o vídeo relacionado com a consulta inicial
            const initialResults = await ytsr(query, { limit: 1 });
            const initialVideo = initialResults.items.find((item) => item.type === 'video');
            if (!initialVideo) {
                throw new Error('No initial video found for related search');
            }

            // Extrair palavras-chave mais relevantes do título ou descrição
            const keywords = initialVideo.title.split(' ').slice(0, 3).join(' '); // Exemplo: usa as primeiras 3 palavras do título

            // Consulta mais refinada usando palavras-chave extraídas
            const refinedQuery = `${keywords} genre`;

            // Buscar vídeos com base na consulta refinada
            const relatedResults = await ytsr(refinedQuery, { limit });
            return relatedResults.items
                .filter((item) => item.type === 'video' && item.url !== initialVideo.url) // Evita duplicar o vídeo inicial
                .map((video) => ({
                    name: video.title,
                    url: video.url,
                    thumbnail: video.thumbnail,
                    duration: null, // Duração pode ser obtida adicionalmente com yt-dlp se necessário
                }));
        } catch (error) {
            console.error('Error searching for related videos:', error);
            throw error;
        }
    }

    async resolve(query) {
        console.log(`Resolving query: ${query}`);
        // Primeiro tenta extrair como URL
        if (await this.validate(query)) {
            return await this.extract(query);
        }

        // Caso não seja uma URL, tenta buscar por string
        return await this.search(query);
    }
}

module.exports = MyCustomExtractor;
