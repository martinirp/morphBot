module.exports = {
    name: 'play',
    description: 'Toca uma música ou um link indicado',
    aliases: ['p'],
    inVoiceChannel: true,
    execute: async (message, client, args) => {
        const string = args.join(' ');
        if (!string) {
            return message.channel.send('Não dá pra procurar nada desse jeito!');
        }

        try {
            // Usando distube.search para buscar no Spotify
            const spotifyResult = await client.distube.search(string, { limit: 1, type: 'track' });

            if (spotifyResult && spotifyResult.length > 0) {
                const track = spotifyResult[0];
                message.channel.send(`Achei no Spotify: ${track.name} por ${track.artist}. Vou tocar agora!`);
                await client.distube.play(message.member.voice.channel, track.url, {
                    member: message.member,
                    textChannel: message.channel,
                    message,
                });

                // Chama o comando save para salvar o link do Spotify
                const saveCommand = client.commands.get('save');
                if (saveCommand) {
                    saveCommand.execute(message, client, [track.url]);
                }
            } else {
                message.channel.send('Não encontrei nada no Spotify. Tente novamente com outra música!');
            }

        } catch (error) {
            console.error('Erro ao buscar no Spotify:', error.message);
            message.channel.send('Ocorreu um erro ao tentar buscar no Spotify. Tente novamente mais tarde!');
        }
    },
};
