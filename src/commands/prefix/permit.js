const { redis } = require('../../redisClient');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'permit',
  description: 'Allow specific users to join locked channel',
  usage: '.v permit @user1 @user2',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can permit users!');
    }

    // Check mentions
    const mentions = message.mentions.members;
    if (mentions.size === 0) {
      return message.reply('ℹ️ Usage: `.v permit @user1 @user2`');
    }

    // Add permissions for each mentioned user
    const results = await Promise.allSettled(
      mentions.map(user => 
        voiceChannel.permissionOverwrites.edit(user, {
          Connect: true
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    message.reply(`✅ Granted access to ${successCount}/${mentions.size} users`);
  }
};