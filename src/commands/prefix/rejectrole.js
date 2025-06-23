const { redis } = require('../../redisClient');

module.exports = {
  name: 'rejectrole',
  description: 'Deny a role access to your voice channel',
  usage: '.v rejectrole @role',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('❌ You must be in a voice channel!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('❌ Only the channel owner can reject roles!');
    }

    // Check role mention
    const role = message.mentions.roles.first();
    if (!role) return message.reply('ℹ️ Usage: `.v rejectrole @role`');

    // Disconnect all role members currently in channel
    const membersInChannel = voiceChannel.members.filter(m => m.roles.cache.has(role.id));
    await Promise.all(membersInChannel.map(m => m.voice.disconnect('Role rejected')));

    // Set role permissions
    try {
      await voiceChannel.permissionOverwrites.edit(role, {
        Connect: false,
        ViewChannel: false
      });
      
      // Store rejected role in Redis
      await redis.sadd(`rejected_roles:${voiceChannel.id}`, role.id);
      message.reply(`❌ Denied access to ${role.name} role (kicked ${membersInChannel.size} users)`);
    } catch (error) {
      console.error(error);
      message.reply('❌ Failed to reject role!');
    }
  }
};