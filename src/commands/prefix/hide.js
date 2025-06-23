const { redis } = require('../../redisClient');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'hide',
  description: 'Hide the voice channel from non-members',
  usage: '.v hide',
  async execute(message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can use this command!');
    }

    const isHidden = await redis.get(`hidden_state:${voiceChannel.id}`) === '1';
    if (isHidden) {
      return message.reply('🚫 This channel is already hidden.');
    }

    const everyoneRole = message.guild.roles.everyone;

    try {
      await Promise.all([
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          ViewChannel: false,
          Connect: false
        }),
        voiceChannel.permissionOverwrites.edit(message.author.id, {
          ViewChannel: true,
          Connect: true
        }),
        redis.set(`hidden_state:${voiceChannel.id}`, '1')
      ]);

      message.reply('👻 Channel is now hidden from others.');
    } catch (err) {
      console.error(err);
      message.reply('💀 Failed to hide the channel.');
    }
  }
};
