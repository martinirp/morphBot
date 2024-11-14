const { ExtractorPlugin } = require('distube');
const ytdl = require('ytdl-core');  // Usando ytdl-core para pegar as informações do vídeo

class MyCustomExtractor extends ExtractorPlugin {
    constructor(options) {
        super(options);
        console.log('MyCustomExtractor initialized');
    }

    async validate(url) {
        console.log(`Validating URL: ${url}`);
        // Validando se a URL é do YouTube
        return (
            url.startsWith('https://') ||
            url.includes('youtube.com') ||
            url.includes('youtu.be')
        );
    }

    async extract(url) {
        console.log(`Extracting from URL: ${url}`);
        try {
            // Usando ytdl-core para obter as informações do vídeo
            const info = await ytdl.getInfo(url);

            // Garantir que a URL retornada seja a do YouTube
            const videoUrl = info.video_url || url;  // Se não encontrar a URL específica, usa a URL original

            return {
                name: info.videoDetails.title,  // Título do vídeo
                url: videoUrl,  // URL do vídeo
                thumbnail: info.videoDetails.thumbnails[0].url,  // Primeira miniatura do vídeo
                duration: info.videoDetails.lengthSeconds,  // Duração do vídeo em segundos
            };
        } catch (error) {
            console.error('Error extracting info:', error);
            throw error;
        }
    }

    async search(query) {
        console.log(`Searching for query: ${query}`);
        try {
            // Utiliza o ytdl-core para buscar o vídeo do YouTube
            const results = await ytdl.search(query, { limit: 1 });
            const video = results[0];
            return video
                ? {
                    name: video.title,
                    url: video.url,
                    thumbnail: video.thumbnail,
                    duration: video.duration,  // Duração obtida da busca
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
            // Realiza a busca inicial
            const initialResults = await ytdl.search(query, { limit: 1 });
            const initialVideo = initialResults[0];
            if (!initialVideo) {
                throw new Error('No initial video found for related search');
            }

            // Buscar vídeos relacionados com base na consulta refinada (aqui usamos o mesmo título, mas pode ser ajustado)
            const relatedResults = await ytdl.search(`${initialVideo.title} related`, { limit });
            return relatedResults
                .filter((video) => video.url !== initialVideo.url)  // Excluir o vídeo inicial dos relacionados
                .map((video) => ({
                    name: video.title,
                    url: video.url,
                    thumbnail: video.thumbnail,
                    duration: video.duration,
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
