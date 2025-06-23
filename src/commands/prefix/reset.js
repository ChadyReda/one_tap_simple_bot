const { redis } = require('../../redisClient');


module.exports = {
  name: 'reset',
  description: 'Reset your temporary voice channel settings to default',
  usage: '.v reset',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can reset it!');
    }

    // Check cooldown (5 minutes = 300 seconds)
    const cooldownKey = `reset_cooldown:${voiceChannel.id}:${creatorId}`;
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      return message.reply('⏳ You can reset your channel only once every 5 minutes. Please wait.');
    }

    try {
      // Keep the @everyone overwrite and the bot's own overwrite if any
      const overwritesToKeep = voiceChannel.permissionOverwrites.cache.filter(perm =>
        perm.id === voiceChannel.guild.roles.everyone.id || perm.id === client.user.id
      );

      // Reset permissions: set only the overwrites to keep
      await voiceChannel.permissionOverwrites.set(overwritesToKeep);

      // Reset channel settings
      await voiceChannel.edit({
        name: 'Temp VC',
        bitrate: 64000,
        userLimit: 0,
        rtcRegion: null // auto region
      });

      // Set cooldown key with 5 minutes expiry
      await redis.set(cooldownKey, '1', 'EX', 300);

      message.reply('✅ Channel settings have been reset to default.');
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to reset the channel settings.');
    }
  }
};
