const axios = require('axios');

module.exports = {
	name: 'lyrics',
	aliases: ['ly'],
	inVoiceChannel: false, // Este comando não precisa que o usuário esteja em um canal de voz
	execute: async (message, client, args) => {
		const queue = client.distube.getQueue(message.guild.id);

		if (!queue || !queue.songs.length) {
			return message.channel.send(
				'Nenhuma música está tocando no momento.'
			);
		}

		// A música atual é a primeira na fila
		const song = queue.songs[0];

		if (!song.name) {
			return message.channel.send('Por favor, forneça o nome da música.');
		}

		// Buscar letra da música
		let lyrics = await fetchLyrics(song.name);

		// Enviar a letra no canal
		if (lyrics.length > 2000) {
			lyrics = lyrics.slice(0, 1500) + '...'; // Limite de 2000 caracteres do Discord
		}

		return message.channel.send(`**Letra da música:**\n\n${lyrics}`);
	},
};

// Função para buscar a letra da música
async function fetchLyrics(song) {
	const baseURL = `https://api.lyrics.ovh/v1`;
	let artist = '';
	let title = '';

	try {
		song = song.replace(/–/g, '-');

		// Tentar dividir a string pelo padrão "artista - título"
		if (song.includes('-')) {
			[artist, title] = song.split('-').map((part) => part.trim());
		}

		// Verificar se o artista e o título foram devidamente capturados
		if (!artist || !title) {
			return 'Por favor, forneça o artista e o título da música no formato "Artista - Título".';
		}

		// Fazer a requisição à API
		const response = await axios.get(`${baseURL}/${artist}/${title}`);

		if (response.data.lyrics) {
			return formatLyrics(response.data.lyrics);
		} else {
			// Tenta buscar invertendo os parametros para casos que o nome da musica vem antes
			let aux = title;
			title = artist;
			artist = aux;

			const response = await axios.get(`${baseURL}/${artist}/${title}`);

			if (response.data.lyrics) {
				return formatLyrics(response.data.lyrics);
			}

			return 'Letra não encontrada.';
		}
	} catch (error) {
		console.error('Error fetching lyrics:', error);
		return 'Erro ao buscar a letra.';
	}
}

function formatLyrics(lyrics) {
	if (!lyrics) return '';

	// Substitui exatamente duas quebras de linha por uma única quebra de linha
	let formattedLyrics = lyrics.replace(/\n{2}(?!\n)/g, '\n');

	// Substitui exatamente quatro quebras de linha por duas quebras de linha
	formattedLyrics = formattedLyrics.replace(/\n{4}/g, '\n\n');

	// Remove espaços extras no início e fim de cada linha
	formattedLyrics = formattedLyrics.replace(/^\s+|\s+$/g, '');

	return formattedLyrics.trim();
}
