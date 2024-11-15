const { SearchResultType } = require('distube');
const MyCustomExtractor = require('./../myCustomExtractor');

module.exports = {
    name: 'mix',
    description: 'Cria um mix com músicas relacionadas',
    aliases: ['m'],
    inVoiceChannel: true,
    execute: async (message, client, args) => {
        const string = args.join(' ');
        if (!string) {
            return message.channel.send('Não dá pra procurar nada desse jeito!');
        }

        const extractor = new MyCustomExtractor();
        let video = await extractor.search(string);

        // Se não encontrar vídeos com a pesquisa inicial, retornar mensagem de erro
        if (!video || !video.url) {
            return message.channel.send('Não encontrei nenhum vídeo para tocar!');
        }

        // Buscar vídeos do mesmo gênero ou tema
        const relatedVideos = await extractor.searchRelated(string, 10);

        // Verificar se encontrou vídeos relacionados
        if (relatedVideos.length === 0) {
            return message.channel.send('Não encontrei vídeos relacionados!');
        }

        // Enviar lista de vídeos encontrados para o canal de texto
        const videoList = relatedVideos.map((video, index) => `${index + 1}. [${video.name}](${video.url})`).join('\n');
        message.channel.send(`Encontrei os seguintes vídeos relacionados:\n${videoList}`);

        // Tocar o vídeo inicial
        client.distube.play(message.member.voice.channel, video.url, {
            member: message.member,
            textChannel: message.channel,
            message,
        });

        // Adicionar um pequeno delay antes de tocar os vídeos relacionados
        await new Promise(resolve => setTimeout(resolve, 1000)); // Adiciona um delay para garantir que o primeiro vídeo seja iniciado

        // Tocar todos os vídeos relacionados
        for (const relatedVideo of relatedVideos) {
            client.distube.play(message.member.voice.channel, relatedVideo.url, {
                member: message.member,
                textChannel: message.channel,
                message,
            });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Adiciona um pequeno delay entre as músicas
        }
    },
};
