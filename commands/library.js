const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'library',
  aliases: ['lib'],
  description: 'Mostra a biblioteca de músicas.',
  async execute(message) {
    try {
      // Caminho para o arquivo JSON
      const filePath = path.join(__dirname, '../data/links.json');
      
      // Lê o arquivo JSON
      const data = fs.readFileSync(filePath, 'utf8');
      const musicList = JSON.parse(data);
      
      // Verifica se há músicas na lista
      if (musicList.length === 0) {
        return message.channel.send('A biblioteca de músicas está vazia.');
      }

      // Mensagens
      let index = 0;
      let response = 'Aqui está a sua biblioteca de músicas:\n';
      
      for (const item of musicList) {
        const { NAME, ARTIST } = item;
        response += `${index + 1}. ${NAME} - ${ARTIST}\n`;
        index++;
        
        // Envia mensagem a cada 5 itens
        if (index % 5 === 0) {
          await message.channel.send(response);
          response = ''; // Limpa a resposta para a próxima parte
        }
      }
      
      // Envia qualquer restante
      if (response) {
        await message.channel.send(response);
      }
      
    } catch (error) {
      console.error('Houve um erro ao tentar mostrar a biblioteca de músicas.', error);
      message.channel.send('Houve um erro ao tentar mostrar a biblioteca de músicas.');
    }
  }
};
