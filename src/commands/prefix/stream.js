const { redis } = require('../../redisClient');

module.exports = {
  name: 'stream',
  description: 'Enable or disable streaming in your voice channel',
  usage: '.v stream <on|off>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 You need to join a voice channel.');

    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 You can only manage your own voice channel!');
    }

    const option = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(option)) {
      return message.reply('ℹ️ Usage: `.v stream <on|off>`');
    }

    const everyoneRole = message.guild.roles.everyone;
    const allowStream = option === 'on';

    await voiceChannel.permissionOverwrites.edit(everyoneRole, {
      Stream: allowStream,
    });

    await voiceChannel.permissionOverwrites.edit(message.author.id, {
      Stream: true,
    });

    return message.reply(`🎥 Streaming has been turned **${allowStream ? 'on' : 'off'}**.`);
  }
};
