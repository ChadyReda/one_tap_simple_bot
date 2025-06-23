const { redis } = require('../../redisClient');

module.exports = {
  name: 'funm',
  description: 'Unmute all users in your voice channel',
  usage: '.v funm',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can use this command!');
    }

    // Remove mutes from all members
    const promises = voiceChannel.members.map(member => {
      return member.voice.setMute(false);
    });

    await Promise.all(promises);
    message.reply('🔊 All users in the channel have been unmuted');
    
    // Clear mute state
    await redis.del(`mute_state:${voiceChannel.id}`);
  }
};