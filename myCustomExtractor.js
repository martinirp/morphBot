const { ExtractorPlugin } = require('distube');
const ytsr = require('ytsr');
const youtubedl = require('youtube-dl-exec'); // Substituto para @distube/yt-dlp

class MyCustomExtractor extends ExtractorPlugin {
    constructor(options) {
        super(options);
        console.log('MyCustomExtractor initialized');
    }

    // Validação básica para URLs do YouTube
    async validate(url) {
        console.log(`Validating URL: ${url}`);
        return (
            url.startsWith('https://') &&
            (url.includes('youtube.com') || url.includes('youtu.be'))
        );
    }

    // Extração de informações usando youtube-dl-exec
    async extract(url) {
        console.log(`Extracting from URL: ${url}`);
        try {
            const info = await youtubedl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                format: 'best',
            });
            console.log(`Info extraída: ${JSON.stringify(info)}`);
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

    // Busca de vídeos no YouTube usando ytsr
    async search(query) {
        console.log(`Searching for query: ${query}`);
        try {
            const results = await ytsr(query, { limit: 1 });
            const video = results.items.find((item) => item.type === 'video');
            if (video) {
                console.log(`Video encontrado: ${video.url}`);
                return {
                    name: video.title,
                    url: video.url,
                    thumbnail: video.bestThumbnail.url,
                    duration: null, // A duração pode ser obtida adicionalmente, se necessário
                };
            } else {
                console.log('Nenhum vídeo encontrado');
                return null;
            }
        } catch (error) {
            console.error('Error searching for video:', error);
            throw error;
        }
    }

    // Resolução geral de URLs ou termos de pesquisa
    async resolve(query) {
        console.log(`Resolving query: ${query}`);
        // Primeiro tenta extrair como URL
        if (await this.validate(query)) {
            return await this.extract(query);
        }
        // Caso não seja uma URL, realiza uma busca
        return await this.search(query);
    }
}

module.exports = MyCustomExtractor;
