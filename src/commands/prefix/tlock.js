const { redis } = require('../../redisClient');

module.exports = {
  name: 'tlock',
  description: 'Lock text chat in your voice channel (only you can speak)',
  usage: '.v tlock',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can lock the VC chat!');
    }

    try {
      // Deny @everyone, allow owner
      await voiceChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
      });

      await voiceChannel.permissionOverwrites.edit(message.author.id, {
        SendMessages: true,
      });

      await redis.set(`tlock:${voiceChannel.id}`, '1');
      message.reply('🔒 VC chat has been locked. Only you can send messages.');
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to lock VC chat.');
    }
  }
};
