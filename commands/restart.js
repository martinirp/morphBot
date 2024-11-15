const { exec } = require('child_process');

module.exports = {
    name: 'restart',
    description: 'Reinicia o bot',
    execute(message) {
        message.channel.send('Reiniciando o bot...').then(() => {
            // Executa o comando para reiniciar o bot
            exec('pm2 restart bot', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Erro ao reiniciar o bot: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
            });
        });
    },
};
