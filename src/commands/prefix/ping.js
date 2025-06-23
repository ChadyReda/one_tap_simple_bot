module.exports = {
  name: 'ping',
  description: 'Check bot latency',
  usage: '.v ping',
  execute(message, args, client) {
    const startTime = Date.now();
    
    message.channel.send('Pong!').then(sentMessage => {
      const latency = Date.now() - startTime;
      const apiLatency = Math.round(client.ws.ping);
      
      sentMessage.edit(
        `BOT Latency: ${latency}ms\n` +
        `API Latency: ${apiLatency}ms`
      );
    });
  }
};