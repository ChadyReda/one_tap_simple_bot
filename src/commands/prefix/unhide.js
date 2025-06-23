const { redis } = require('../../redisClient');

module.exports = {
  name: 'unhide',
  description: 'Make your voice channel visible',
  usage: '.v unhide',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can unhide it!');
    }

    const isHidden = await redis.get(`hidden_state:${voiceChannel.id}`) === '1';
    if (!isHidden) {
      return message.reply('👁️ This channel is already visible.');
    }

    try {
      await Promise.all([
        voiceChannel.permissionOverwrites.edit(message.guild.id, {
          ViewChannel: true,
          Connect: true
        }),
        redis.del(`hidden_state:${voiceChannel.id}`)
      ]);

      message.reply('👀 Voice channel is now visible to others.');
    } catch (error) {
      console.error(error);
      message.reply('💀 Failed to unhide the channel!');
    }
  }
};
