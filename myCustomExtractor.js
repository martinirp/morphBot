const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');  // Utilizando o ffmpeg estático para processamento de áudio
const { createAudioResource, AudioPlayerStatus, createAudioPlayer } = require('@discordjs/voice');
const { exec } = require('child_process');  // Para executar o ffmpeg

class MyCustomExtractor {
    constructor(options) {
        console.log('MyCustomExtractor initialized');
    }

    // Valida se o link fornecido é uma URL do YouTube válida
    async validate(url) {
        console.log(`Validating URL: ${url}`);
        const isValid =
            url.startsWith('https://') &&
            (url.includes('youtube.com') || url.includes('youtu.be'));
        return isValid;
    }

    // Extrai informações de vídeo a partir do URL fornecido
    async extract(url) {
        console.log(`Extracting from URL: ${url}`);
        try {
            const info = await ytdl.getInfo(url);
            return {
                name: info.videoDetails.title,  // Nome do vídeo
                url: info.videoDetails.video_url,  // URL do vídeo
                thumbnail: info.videoDetails.thumbnails[0].url,  // Thumbnail do vídeo
                duration: info.videoDetails.lengthSeconds,  // Duração do vídeo em segundos
            };
        } catch (error) {
            console.error('Error extracting info:', error);
            throw error;
        }
    }

    // Realiza uma busca no YouTube usando a query fornecida
    async search(query) {
        console.log(`Searching for query: ${query}`);
        try {
            const info = await ytdl.getInfo(query);  // Pode ser URL ou um termo de pesquisa
            const video = {
                name: info.videoDetails.title,
                author: info.videoDetails.ownerChannelName,
                url: info.videoDetails.video_url,
                thumbnail: info.videoDetails.thumbnails[0].url,
                duration: info.videoDetails.lengthSeconds,
            };
            return video;
        } catch (error) {
            console.error('Error searching for video:', error);
            throw error;
        }
    }

    // Resolve se é uma URL válida ou realiza uma busca
    async resolve(query) {
        console.log(`Resolving query: ${query}`);

        if (await this.validate(query)) {
            console.log('Query is a valid URL');
            const info = await this.extract(query);
            return {
                name: info.name,
                url: info.url,
                thumbnail: info.thumbnail,
                duration: info.duration,
            };
        } else {
            console.log('Query is not a URL, performing search');
            return await this.search(query);
        }
    }

    // Cria um áudio stream para o Discord usando o ffmpeg e ytdl-core
    async createAudioStream(url) {
        // Usar ytdl-core para pegar o áudio do vídeo
        const stream = ytdl(url, {
            filter: 'audioonly',
            quality: 'highestaudio',
        });

        // Usar o ffmpeg para processar o stream de áudio
        const audioStream = exec(
            `${ffmpeg} -i pipe:0 -f opus -ac 2 -ar 48000 -c:a libopus pipe:1`,
            { input: stream },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('Error during ffmpeg execution:', error);
                }
                if (stderr) {
                    console.error('ffmpeg stderr:', stderr);
                }
            }
        );

        // Criar o audio resource do Discord com o stream processado
        const audioResource = createAudioResource(audioStream.stdout, {
            inputType: AudioPlayerStatus.Playing,
        });

        return audioResource;
    }

    // Função para tocar áudio no canal de voz
    async playAudioInVoiceChannel(connection, url) {
        const audioResource = await this.createAudioStream(url);
        const audioPlayer = createAudioPlayer();
        connection.subscribe(audioPlayer);
        audioPlayer.play(audioResource);

        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio finished playing.');
        });

        audioPlayer.on('error', (error) => {
            console.error('AudioPlayer error:', error);
        });
    }
}

module.exports = MyCustomExtractor;
