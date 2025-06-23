const prefix = process.env.BOT_PREFIX || '.v';

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.prefix.get(commandName);

    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(error);
      message.reply('There was an error executing that command!');
    }
  }
};