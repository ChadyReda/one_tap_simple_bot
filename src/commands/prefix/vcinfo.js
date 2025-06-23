const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'vcinfo',
  description: 'Display detailed voice channel information',
  usage: '.v vcinfo',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({
        content: '🔊 You must be in a voice channel to use this!',
        ephemeral: true
      });
    }

    try {
      const [
        ownerId,
        isLocked,
        isHidden,
        userLimit,
        status,
        sbState,
        creationTime
      ] = await Promise.all([
        redis.get(`creator:${voiceChannel.id}`),
        redis.get(`locked:${voiceChannel.id}`),
        redis.get(`hidden_state:${voiceChannel.id}`),
        redis.get(`limit:${voiceChannel.id}`),
        redis.get(`status:${voiceChannel.id}`),
        redis.get(`soundboard:${voiceChannel.id}`),
        redis.get(`created_at:${voiceChannel.id}`)
      ]);

      let ownerName = 'Unknown';
      let ownerAvatar = null;
      if (ownerId) {
        try {
          const owner = await message.guild.members.fetch(ownerId);
          ownerName = owner.displayName || owner.user.username;
          ownerAvatar = owner.user.displayAvatarURL();
        } catch (err) {
          console.warn('Owner fetch error:', err);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(`${status?.match(/[\p{Emoji}]/u)?.[0] || '🔊'} ${voiceChannel.name}`)
        .setColor('#1E90FF')
        .setThumbnail(ownerAvatar)
        .addFields(
          {
            name: '👑 Owner',
            value: `<@${ownerId || '0'}> (${ownerName})`,
            inline: false
          },
          {
            name: '👥 Members',
            value: `${voiceChannel.members.size} / ${userLimit || '∞'}`,
            inline: false
          },
          {
            name: '🔐 Settings',
            value: `Locked: ${isLocked === '1' ? '✅' : '❌'} \n Hidden: ${isHidden === '1' ? '✅' : '❌'} \n Soundboard: ${sbState === '1' ? '✅' : '❌'}`,
            inline: false
          }
        )
        .setFooter({
          text: `ID: ${voiceChannel.id}`,
          iconURL: ownerAvatar
        });

      await message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('vcinfo command error:', error);
      message.reply('💀 Failed to fetch channel info - please try again later');
    }
  }
};
