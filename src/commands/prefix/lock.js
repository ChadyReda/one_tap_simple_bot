const { redis } = require('../../redisClient');

module.exports = {
  name: 'lock',
  description: 'Lock the channel (prevent others from joining)',
  usage: '.v lock',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 join a voice channel first!');

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 only voice owner can do this!');
    }

    const everyoneRole = message.guild.roles.everyone;
    const isLocked = await redis.get(`locked:${voiceChannel.id}`) === '1';

    if (isLocked) return message.reply('🔒 Channel is already locked.');

    try {
      await Promise.all([
        // Deny @everyone from joining
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: false
        }),
        // Allow owner to always connect
        voiceChannel.permissionOverwrites.edit(message.author.id, {
          Connect: true
        }),
        redis.set(`locked:${voiceChannel.id}`, '1')
      ]);

      message.reply('🔒 Channel locked. Others cannot join!');
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to lock the channel!');
    }
  }
};