const { redis } = require('../../redisClient');
const { execute } = require('./claim');

module.exports = {
  name: 'name',
  description: 'Change your voice channel name',
  usage: '.v name <new-name>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('💌 Join a voice channel first!');
    }

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can rename it!');
    }

    // Check cooldown (1 minute)
    const cooldownKey = `rename_cooldown:${voiceChannel.id}:${creatorId}`;
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      return message.reply('⏳ You can rename your channel only once every 60 seconds. Please wait.');
    }

    // Validate new name
    const newName = args.join(' ').trim();
    if (!newName) return message.reply('ℹ️ Usage: `.v name <new-name>`');
    if (newName.length > 100) {
      return message.reply('😑 Name must be under 100 characters!');
    }

    try {
      // Rename channel
      await voiceChannel.setName(newName);

      // Set cooldown with 60 seconds expiry
      await redis.set(cooldownKey, '1', 'EX', 60);

      message.reply(`✅ Channel renamed to: ${newName}`);
    } catch (error) {
      console.error(error);
      message.reply('💀 Failed to rename channel!');
    }
  }
};


