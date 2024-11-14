const { PlayOptions } = require('distube');

const fs = require('fs');
const path = require('path');

const MyCustomExtractor = require('./../myCustomExtractor');

module.exports = {
	name: 'play',
	aliases: ['p'],
	inVoiceChannel: true,
	execute: async (message, client, args) => {
		const nameOrLinkVideo = args.join(' ');
		if (!nameOrLinkVideo) {
			return message.channel.send(
				'Entre com um valor válido para pesquisa.'
			);
		}

		const customExtractor = new MyCustomExtractor();

		let infoVideo = await customExtractor.resolve(nameOrLinkVideo);

		if (!infoVideo) {
			return message.channel.send('Vídeo não foi encontrado.');
		}

		message.channel.send(`To procurando aqui pae, pera ai...`);

		client.distube
			.play(message.member.voice.channel, infoVideo.url, {
				member: message.member,
				textChannel: message.channel,
				message,
				// metadata?: T;
				// position
				// skip
			})
			.then(() => {
				message.channel.send(`Achei essa braba aqui ${infoVideo.url}`);

				saveUrlToFile(infoVideo.url);
			});
	},
};

function saveUrlToFile(url) {
	return new Promise((resolve, reject) => {
		const filePath = path.join(__dirname, '..', 'playlist', 'videos.txt');

		// Lê o conteúdo do arquivo existente
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err && err.code !== 'ENOENT') {
				// Se o erro não for "arquivo não encontrado", rejeita a promise
				return reject(err);
			}

			// Verifica se a URL já está presente no arquivo
			const urls = data
				? data.split('\n').map((line) => line.trim())
				: [];
			if (urls.includes(url)) {
				return resolve(); // URL já existe, não faz nada
			}

			// Adiciona a URL ao arquivo
			fs.appendFile(filePath, `${url}\n`, (err) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
}
