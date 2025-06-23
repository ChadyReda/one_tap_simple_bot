const { redis } = require('../../redisClient');

module.exports = {
  name: 'transfer',
  description: 'Transfer voice channel ownership',
  usage: '.v transfer @user',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify current ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the current owner can transfer ownership!');
    }

    // Check target user
    const newOwner = message.mentions.members.first();
    if (!newOwner) return message.reply('ℹ️ Usage: `.v transfer @user`');
    if (newOwner.id === message.author.id) {
      return message.reply('❤️ You already own this channel!');
    }

    // Verify new owner is in voice
    if (!voiceChannel.members.has(newOwner.id)) {
      return message.reply('🧐 New owner must be in the voice channel!');
    }

    // Transfer ownership
    try {
      await redis.pipeline()
        .set(`creator:${voiceChannel.id}`, newOwner.id, 'EX', 86400)
        .sadd(`transferred:${newOwner.id}`, voiceChannel.id)
        .exec();

      // Update permissions
      await voiceChannel.permissionOverwrites.edit(newOwner, {
        ManageChannels: true,
        MoveMembers: true
      });

      message.reply(`✅ Transferred ownership to ${newOwner.displayName}`);
      newOwner.send(`🎉 You now own the voice channel: ${voiceChannel.name}`);
    } catch (error) {
      console.error(error);
      message.reply('💀 Failed to transfer ownership!');
    }
  }
};
