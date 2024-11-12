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

	// async getVideo(query) {
	// 	// Primeiro tenta extrair como URL
	// 	if (await this.validate(query)) {
	// 		return await this.extract(query);
	// 	}

	// 	// Caso não seja uma URL, tenta buscar por string
	// 	return await this.search(query);
	// }

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
