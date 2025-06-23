const { redis } = require('../../redisClient');

module.exports = {
  name: 'clear',
  description: 'Kick all users from your current voice channel',
  usage: '.v clear',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Check ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can use this command!');
    }

    // Kick all users (except the invoker)
    const membersToKick = voiceChannel.members.filter(m => m.id !== message.author.id);
    if (membersToKick.size === 0) return message.reply('ℹ️ No one to kick from the channel.');

    try {
      for (const [memberId, member] of membersToKick) {
        await member.voice.disconnect('🤣 Channel cleared by owner');
      }

      message.reply(`✅ Cleared ${membersToKick.size} user(s) from the voice channel.`);
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to clear the voice channel.');
    }
  }
};
