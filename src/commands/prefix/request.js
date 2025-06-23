const { redis } = require('../../redisClient');
const { ChannelType } = require('discord.js');

const COOLDOWN_SECONDS = 60;

module.exports = {
  name: 'request',
  description: 'Request access to a locked voice channel',
  usage: '.v request [channel-name]',
  async execute(message, args, client) {

    // Get channel by name or use the first locked VC
    let targetChannel;
    if (args.length > 0) {
      const name = args.join(' ').toLowerCase();
      targetChannel = message.guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildVoice && ch.name.toLowerCase() === name
      );
    } else {
      // No args provided — find first locked VC
      const voiceChannels = message.guild.channels.cache.filter(
        ch => ch.type === ChannelType.GuildVoice
      );

      for (const [id, ch] of voiceChannels) {
        const isLocked = await redis.get(`locked:${id}`);
        if (isLocked === '1') {
          targetChannel = ch;
          break;
        }
      }
    }

    if (!targetChannel) return message.reply('🧐 Could not find a locked voice channel.');

    // Check if it's locked
    const isLocked = await redis.get(`locked:${targetChannel.id}`);
    if (isLocked !== '1') return message.reply('ℹ️ This channel is not locked.');

    // Cooldown logic
    const cooldownKey = `cooldown:request:${message.author.id}:${targetChannel.id}`;
    const isOnCooldown = await redis.get(cooldownKey);
    if (isOnCooldown) {
      return message.reply(`⏳ You already requested access recently. Try again in ${COOLDOWN_SECONDS} seconds.`);
    }

    // Get channel owner
    const ownerId = await redis.get(`creator:${targetChannel.id}`);
    if (!ownerId) return message.reply('🧐 No owner found for this channel.');

    try {
      const owner = await message.guild.members.fetch(ownerId);

      await owner.send(`🔔 **${message.author.tag}** is requesting access to your voice channel **${targetChannel.name}** in **${message.guild.name}**.`)
        .catch(() => message.reply('⚠️ Could not DM the channel owner. They may have DMs disabled.'));

      await redis.set(cooldownKey, '1', 'EX', COOLDOWN_SECONDS);
      return message.reply(`✅ Request sent to the owner of **${targetChannel.name}**.`);
    } catch (err) {
      console.error(err);
      return message.reply('💀 Failed to send the request.');
    }
  }
};
