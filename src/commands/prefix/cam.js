const { redis } = require('../../redisClient');

module.exports = {
  name: 'cam',
  description: 'Enable/disable streaming in your voice channel',
  usage: '.v cam [on/off]',
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
      return message.reply('ℹ️ Usage: `.v cam <on|off>`');
    }

    // Update channel permissions
    await voiceChannel.permissionOverwrites.edit(message.guild.id, {
      Stream: state === 'on'
    });

    message.reply(`✅ Streaming ${state === 'on' ? 'enabled' : 'disabled'}`);
  }
};