const { redis } = require('../../redisClient');

module.exports = {
  name: 'status',
  description: 'Set your voice channel status (emoji + text)',
  usage: '.v status [emoji] [text]',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can set status!');
    }

    if (args.length === 0) {
      return message.reply('😒 You must provide a status. Example: `.v status 🎮 Gaming`');
    }

    let emoji = '🔹';
    let statusText = args.join(' ');

    // Check if first arg is a valid emoji or Discord custom emoji
    const emojiRegex = /^(\p{Emoji}|<a?:\w+:\d+>)$/u;

    if (emojiRegex.test(args[0])) {
      emoji = args[0];
      statusText = args.slice(1).join(' ') || 'Private Room';
    }

    const newName = `${emoji} ${statusText}`.slice(0, 100);

    try {
      await voiceChannel.setName(newName);
      await redis.set(`status:${voiceChannel.id}`, newName);
      message.reply(`✅ Channel status set to: ${newName}`);
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to update channel status!');
    }
  }
};
