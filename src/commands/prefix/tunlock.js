const { redis } = require('../../redisClient');

module.exports = {
  name: 'tunlock',
  description: 'Unlock text chat in your voice channel',
  usage: '.v tunlock',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can unlock the VC chat!');
    }

    try {
      await voiceChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: true,
      });

      await voiceChannel.permissionOverwrites.delete(message.author.id).catch(() => {});

      await redis.set(`tlock:${voiceChannel.id}`, '0');
      message.reply('🔓 VC chat has been unlocked for everyone.');
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to unlock VC chat.');
    }
  }
};
