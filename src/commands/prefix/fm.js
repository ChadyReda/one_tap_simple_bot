const { redis } = require('../../redisClient');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'fm',
  description: 'Silence all users in your voice channel',
  usage: '.v fm',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can use this command!');
    }

    // Apply mute to all members
    const promises = voiceChannel.members.map(member => {
      if (member.id === message.author.id) return; // Skip self
      return member.voice.setMute(true);
    });

    await Promise.all(promises);
    message.reply('🔇 All users in the channel have been muted');
    
    // Store mute state in Redis
    await redis.set(`mute_state:${voiceChannel.id}`, '1');
  }
};