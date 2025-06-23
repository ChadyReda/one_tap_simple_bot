const { redis } = require('../../redisClient');

module.exports = {
  name: 'activity',
  description: 'Enable/disable activity in your voice channel',
  usage: '.v activity [on/off]',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Check ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 You can only manage your own voice channel!');
    }

    const state = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(state)) {
      return message.reply('ℹ️ Usage: `.v activity <on|off>`');
    }

    // Toggle activity status
    await redis.set(`activity:${voiceChannel.id}`, state === 'on' ? '1' : '0');
    message.reply(`✅ Activity tracking ${state === 'on' ? 'enabled' : 'disabled'}`);
  }
};