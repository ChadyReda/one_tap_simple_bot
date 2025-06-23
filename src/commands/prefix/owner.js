const { redis } = require('../../redisClient');

module.exports = {
  name: 'owner',
  description: 'Check current voice channel owner',
  usage: '.v owner',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Get owner from Redis
    const ownerId = await redis.get(`creator:${voiceChannel.id}`);
    if (!ownerId) return message.reply('ℹ️ This channel has no registered owner');

    // Fetch owner details
    try {
      const owner = await message.guild.members.fetch(ownerId);
      message.reply(`👑 Channel owner: ${owner.displayName}`);
    } catch {
      message.reply('ℹ️ Original owner left the server');
    }
  }
};