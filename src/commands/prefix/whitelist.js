const { redis } = require('../../redisClient');

module.exports = {
  name: 'whitelist',
  description: 'Manage your persistent whitelist for all your temporary VCs',
  usage: '.v whitelist <add|remove|list|clear> [@user or ID]',
  async execute(message, args) {
    const sub = args[0];
    const userMention = message.mentions.users.first();

    // Check if user is in a voice channel (context but optional)
    const voiceChannel = message.member.voice.channel;
    let isOwner = false;

    if (voiceChannel) {
      const creatorId = await redis.get(`creator:${voiceChannel.id}`);
      isOwner = creatorId === message.author.id;
    }

    // Redis key for whitelist owner = message author
    const key = `vc:whitelist:${message.author.id}`;

    if (sub === 'add') {
      const targetId = userMention?.id || args[1];
      if (!targetId)
        return message.reply('🤦‍♂️ You must mention a user or provide their ID.');

      if (targetId === message.author.id)
        return message.reply('🤔 You can\'t whitelist yourself.');

      const isWhitelisted = await redis.sismember(key, targetId);
      if (isWhitelisted)
        return message.reply(`⚠️ <@${targetId}> is already in your whitelist.`);

      // Remove from blacklist automatically
      await redis.srem(`vc:blacklist:${message.author.id}`, targetId);
      await redis.sadd(key, targetId);

      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.edit(targetId, {
            Connect: true,
            ViewChannel: true,
          });
        } catch (error) {
          console.error('Failed to set permissions on current channel:', error);
        }
      }

      return message.reply(`✅ Added <@${targetId}> to your whitelist. They'll be able to join all your future VCs!`);
    }

    if (sub === 'remove') {
      const input = args[1];
      const targetUser = userMention || (input && await message.client.users.fetch(input).catch(() => null));
      if (!targetUser)
        return message.reply('🤦‍♀️ You must mention a user or provide their ID to remove.');

      const isWhitelisted = await redis.sismember(key, targetUser.id);
      if (!isWhitelisted)
        return message.reply(`⚠️ ${targetUser.tag} is not in your whitelist.`);

      await redis.srem(key, targetUser.id);

      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.delete(targetUser.id);
        } catch (error) {
          console.error('Failed to remove permissions from current channel:', error);
        }
      }

      return message.reply(`✅ Removed ${targetUser.tag} from your whitelist.`);
    }

    if (sub === 'list') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply('📭 Your whitelist is empty.');

      const names = await Promise.all(
        ids.map(async (id) => {
          try {
            const member = await message.guild.members.fetch(id);
            return member.user.tag;
          } catch {
            return `❓ Unknown User (${id})`;
          }
        })
      );

      return message.reply(`📄 Your whitelisted users (applies to all your VCs):\n${names.join('\n')}`);
    }

    if (sub === 'clear') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply('📭 Your whitelist is already empty.');

      if (voiceChannel && isOwner) {
        for (const id of ids) {
          try {
            await voiceChannel.permissionOverwrites.delete(id);
          } catch {
            // Ignore
          }
        }
      }

      await redis.del(key);
      return message.reply('🗑️ Cleared your whitelist. This affects all future VCs you create.');
    }

    return message.reply('ℹ️ Usage: `.v whitelist <add|remove|list|clear> [@user or ID]`\n💡 Your whitelist applies to all VCs you create!');
  },
};
