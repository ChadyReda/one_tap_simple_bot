const { redis } = require('../../redisClient');

module.exports = {
  name: 'reject',
  description: 'Deny a user access to your voice channel',
  usage: '.v reject @user',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can reject users!');
    }

    // Check user mention
    const user = message.mentions.members.first();
    if (!user) return message.reply('ℹ️ Usage: `.v reject @user`');

    // Disconnect if currently in channel
    if (user.voice.channelId === voiceChannel.id) {
      await user.voice.disconnect('Rejected by owner');
    }

    // Set deny permissions
    try {
      await voiceChannel.permissionOverwrites.edit(user, {
        Connect: false,
        ViewChannel: false
      });
      
      // Store rejected user in Redis
      await redis.sadd(`rejected_users:${voiceChannel.id}`, user.id);
      message.reply(`😶‍🌫️ Denied access to ${user.displayName}`);
    } catch (error) {
      console.error(error);
      message.reply('💀 Failed to reject user!');
    }
  }
};