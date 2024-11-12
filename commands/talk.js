const fs = require('fs');
const path = require('path');

// Define o caminho para o arquivo JSON contendo as frases
const phrasesPath = path.join(__dirname, 'data', 'phrases.json');

// Lê o conteúdo do arquivo JSON
const phrases = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));

module.exports = {
	name: 'talk',
	description: 'Marca uma pessoa 5 vezes e envia 5 frases aleatórias com atraso de 2 minutos entre as mensagens',
	aliases: ['t'],
	args: true,
	usage: '<@usuário>',
	async execute(message, client, args) {
		// Verifica se o argumento é um usuário mencionado
		const user = message.mentions.users.first();
		if (!user) {
			return message.channel.send('Você precisa mencionar uma pessoa para marcar!');
		}

		// Função para enviar uma mensagem com uma frase aleatória
		const sendMessage = async (index) => {
			if (index >= 5) return; // Para quando 5 mensagens foram enviadas

			// Escolhe uma frase aleatória
			const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
			// Envia a mensagem mencionando o usuário
			await message.channel.send(`${user} ${randomPhrase}`);

			// Aguarda 2 minutos antes de enviar a próxima mensagem
			setTimeout(() => sendMessage(index + 1), 2 * 60 * 1000);
		};

		// Inicia o envio das mensagens
		sendMessage(0);
	},
};
