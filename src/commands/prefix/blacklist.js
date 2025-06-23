const { redis } = require('../../redisClient');

module.exports = {
  name: 'blacklist',
  description: 'Manage your persistent blacklist for all your temporary VCs',
  usage: '.v blacklist <add|remove|list|clear> [@user or ID]',
  async execute(message, args) {
    const sub = args[0];
    const userMention = message.mentions.users.first();

    const voiceChannel = message.member.voice.channel;
    let isOwner = false;

    if (voiceChannel) {
      const creatorId = await redis.get(`creator:${voiceChannel.id}`);
      isOwner = creatorId === message.author.id;
    }

    const key = `vc:blacklist:${message.author.id}`;

    if (sub === 'add') {
      const targetId = userMention?.id || args[1];
      if (!targetId)
        return message.reply('🤦‍♂️ You must mention a user or provide their ID.');

      if (targetId === message.author.id)
        return message.reply('🤨 You can’t blacklist yourself.');

      const isBlacklisted = await redis.sismember(key, targetId);
      if (isBlacklisted)
        return message.reply(`⚠️ <@${targetId}> is already blacklisted.`);

      // Auto-remove from whitelist
      await redis.srem(`vc:whitelist:${message.author.id}`, targetId);
      await redis.sadd(key, targetId);

      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.edit(targetId, {
            Connect: false,
            ViewChannel: false,
          });
        } catch (err) {
          console.error('Failed to apply blacklist permissions:', err);
        }
      }

      return message.reply(`🚫 <@${targetId}> is now blacklisted. They’ll be blocked from joining your future VCs.`);
    }

    if (sub === 'remove') {
      const input = args[1];
      const targetUser = userMention || (input && await message.client.users.fetch(input).catch(() => null));
      if (!targetUser)
        return message.reply('🤦‍♂️ You must mention a user or provide their ID to remove.');

      const isBlacklisted = await redis.sismember(key, targetUser.id);
      if (!isBlacklisted)
        return message.reply(`⚠️ ${targetUser.tag} is not in your blacklist.`);

      await redis.srem(key, targetUser.id);

      if (voiceChannel && isOwner) {
        try {
          await voiceChannel.permissionOverwrites.delete(targetUser.id);
        } catch (err) {
          console.error('Failed to remove blacklist permissions:', err);
        }
      }

      return message.reply(`✅ Removed ${targetUser.tag} from your blacklist.`);
    }

    if (sub === 'list') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply('📭 Your blacklist is empty.');

      const names = await Promise.all(
        ids.map(async (id) => {
          try {
            const member = await message.guild.members.fetch(id);
            return member.user.tag;
          } catch {
            return `❓ Unknown (${id})`;
          }
        })
      );

      return message.reply(`📄 Your blacklisted users:\n${names.join('\n')}`);
    }

    if (sub === 'clear') {
      const ids = await redis.smembers(key);
      if (!ids.length) return message.reply('📭 Your blacklist is already empty.');

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
      return message.reply('🗑️ Cleared your blacklist. This affects all future VCs you create.');
    }

    return message.reply('ℹ️ Usage: `.v blacklist <add|remove|list|clear> [@user or ID]`\n💡 Your blacklist blocks users from all future VCs you create.');
  },
};
