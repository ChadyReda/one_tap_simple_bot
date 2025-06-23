const { redis } = require('../../redisClient');

module.exports = {
  name: 'kick',
  description: 'Kick a user from your voice channel',
  usage: '.v kick @user',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can kick users!');
    }

    // Find target user
    const target = message.mentions.members.first();
    if (!target) return message.reply('ℹ️ Usage: `.v kick @username`');

    // Can't kick yourself
    if (target.id === message.author.id) {
      return message.reply('🤣 You cannot kick yourself!');
    }

    // Can't kick other owners
    const targetIsOwner = await redis.get(`creator:${voiceChannel.id}`) === target.id;
    if (targetIsOwner) {
      return message.reply('👍 You cannot kick another owner!');
    }

    // Execute kick
    if (target.voice.channelId === voiceChannel.id) {
      await target.voice.disconnect('Kicked by channel owner');
      message.reply(`✅ Successfully kicked ${target.displayName}`);
    } else {
      message.reply('💀 That user is not in your voice channel!');
    }
  }
};