const MyCustomExtractor = require('./../myCustomExtractor');
const { Client, Message } = require('discord.js');
const SpotifyWebApi = require('spotify-web-api-node'); // Biblioteca para acessar o Spotify

// Caminho para o arquivo links.txt
const path = require('path');
const filePath = path.join(__dirname, '..', 'data', 'links.txt');

// Configuração do Spotify
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Função para salvar o link no arquivo
function saveLink(link) {
    const fs = require('fs');
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '', 'utf8');
        }
        fs.appendFileSync(filePath, link + '\n', 'utf8');
        console.log(`Link adicionado ao arquivo TXT: ${link}`);
    } catch (error) {
        console.error(`Erro ao salvar link: ${error}`);
    }
}

async function searchOnSpotify(query) {
    try {
        const token = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(token.body['access_token']);

        const result = await spotifyApi.searchTracks(query, { limit: 1 });
        if (result.body.tracks.items.length > 0) {
            const track = result.body.tracks.items[0];
            return track.external_urls.spotify; // Retorna o link do Spotify
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar no Spotify:', error);
        return null;
    }
}

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

        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|playlist\?|channel\/|user\/|c\/)?[A-Za-z0-9_-]+/;
        let url;

        try {
            // Verifica se a string é um link do YouTube
            if (string.startsWith('http')) {
                if (!youtubeRegex.test(string)) {
                    return message.channel.send('Tá querendo me enganar? Isso não é um link do YouTube!');
                } else {
                    url = string;
                    message.channel.send(`Coe ${message.author.username}, vou tocar esse link`);
                }
            } else {
                // Caso não seja um link, utiliza o MyCustomExtractor para resolver o nome
                const teste = new MyCustomExtractor();
                const resolved = await teste.resolve(string);

                if (!resolved || !resolved.url) {
                    return message.channel.send('Achei bosta!');
                }

                url = resolved.url;
                message.channel.send(`Coe ${message.author.username}, achei essa aqui ${url}. Serve?`);
            }

            // Tocar o link
            try {
                await client.distube.play(message.member.voice.channel, url, {
                    member: message.member,
                    textChannel: message.channel,
                    message,
                });
            } catch (error) {
                console.error('Erro ao tentar tocar o link no YouTube:', error);
                message.channel.send('Houve um problema ao tentar tocar a música no YouTube. Vou procurar no Spotify!');

                // Busca no Spotify
                const spotifyUrl = await searchOnSpotify(string);
                if (spotifyUrl) {
                    message.channel.send(`Encontrei no Spotify: ${spotifyUrl}`);
                    return; // Retorna para evitar salvar o link do YouTube que falhou
                } else {
                    return message.channel.send('Não consegui encontrar essa música no Spotify também.');
                }
            }

            // Chamar o comando save para armazenar o link
            const saveCommand = client.commands.get('save');
            if (saveCommand) {
                saveCommand.execute(message, client, [url]);
            }

        } catch (error) {
            console.error('Erro ao processar o comando play:', error);
            message.channel.send('Ocorreu um erro ao tentar processar sua solicitação.');
        }
    },
};
