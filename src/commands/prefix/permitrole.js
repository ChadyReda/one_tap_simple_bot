const { redis } = require('../../redisClient');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'permitrole',
  description: 'Allow a role to access your voice channel',
  usage: '.v permitrole @role',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can permit roles!');
    }

    // Check role mention
    const role = message.mentions.roles.first();
    if (!role) return message.reply('ℹ️ Usage: `.v permitrole @role`');

    // Add role permission
    try {
      await voiceChannel.permissionOverwrites.edit(role, {
        Connect: true,
        ViewChannel: true
      });
      
      // Store permitted role in Redis
      await redis.sadd(`permitted_roles:${voiceChannel.id}`, role.id);
      message.reply(`✅ Granted access to ${role.name} role`);
    } catch (error) {
      console.error(error);
      message.reply('💀 Failed to permit role!');
    }
  }
};