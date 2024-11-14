const { ExtractorPlugin } = require('distube');
const ytsr = require('@distube/ytsr');
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
		const isValid =
			url.startsWith('https://') &&
			(url.includes('youtube.com') || url.includes('youtu.be'));
		return isValid;
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
}

module.exports = MyCustomExtractor;
