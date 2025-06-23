const { redis } = require('../../redisClient');

module.exports = {
  name: 'claim',
  description: 'Take ownership of current voice channel',
  usage: '.v claim',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    const currentOwnerId = await redis.get(`creator:${voiceChannel.id}`);

    // If there is an owner, check if they're still in the VC
    if (currentOwnerId) {
      const ownerStillInside = voiceChannel.members.has(currentOwnerId);
      if (ownerStillInside) {
        return message.reply('😒 This channel already has an active owner!');
      }
    }

    // Assign ownership
    await redis.set(`creator:${voiceChannel.id}`, message.author.id);
    await redis.expire(`creator:${voiceChannel.id}`, 86400); // 24h TTL

    // Grant owner permissions
    await voiceChannel.permissionOverwrites.edit(message.author.id, {
      ManageChannels: true,
      MoveMembers: true,
      Connect: true,
      ViewChannel: true
    });

    message.reply('✅ You are now the owner of this voice channel!');
  }
};


























