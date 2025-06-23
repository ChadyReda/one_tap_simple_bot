const { redis } = require('../../redisClient');


module.exports = {
  name: 'sb',
  description: 'Toggle soundboard usage in your voice channel',
  usage: '.v sb [on/off]',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('💌 Join a voice channel first!');

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply('😒 Only the channel owner can control soundboard!');
    }

    // Determine new state
    const state = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(state)) {
      return message.reply('ℹ️ Usage: `.v sb <on|off>`');
    }

    // Update permissions
    try {
      await voiceChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
        UseSoundboard: state === 'on'
      });
      
      // Store state in Redis
      await redis.set(`soundboard:${voiceChannel.id}`, state === 'on' ? '1' : '0');
      message.reply(`✅ Soundboard ${state === 'on' ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error(error);
      message.reply('💀 Failed to update soundboard settings!');
    }
  }
};