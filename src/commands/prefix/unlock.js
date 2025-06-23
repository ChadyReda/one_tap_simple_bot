const { redis } = require('../../redisClient');


module.exports = {
  name: 'unlock',
  description: 'Unlock the channel (allow others to join)',
  usage: '.v unlock',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 join a voice channel first!');

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 only voice owner can do this!');
    }

    const everyoneRole = message.guild.roles.everyone;
    const isLocked = await redis.get(`locked:${voiceChannel.id}`) === '1';

    if (!isLocked) {
      return message.reply('🔓 This channel is already unlocked.');
    }

    try {
      await Promise.all([
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: true
        }),
        redis.set(`locked:${voiceChannel.id}`, '0')
      ]);
      message.reply('🔓 Channel is now unlocked. Others can join.');
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to unlock the channel.');
    }
  }
};
