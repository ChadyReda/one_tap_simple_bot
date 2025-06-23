const { redis } = require('../../redisClient');

module.exports = {
  name: 'limit',
  description: 'Set user limit for your voice channel',
  usage: '.v limit <number>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can set limits!');
    }

    // Validate input
    const limit = parseInt(args[0]);
    if (isNaN(limit)) return message.reply('ℹ️ Usage: `.v limit <number>`');
    if (limit < 0 || limit > 99) {
      return message.reply('😑 Limit must be between 0-99 (0 = no limit)');
    }

    // Set limit and store in Redis
    await Promise.all([
      voiceChannel.setUserLimit(limit),
      redis.set(`limit:${voiceChannel.id}`, limit)
    ]);

    message.reply(`✅ Set user limit to ${limit === 0 ? 'unlimited' : limit}`);
  }
};