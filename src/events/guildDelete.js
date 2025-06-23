const { redis } = require('../redisClient');

module.exports = {
  name: 'guildDelete',
  async execute(guild) {
    console.log(`Left guild: ${guild.name} (${guild.id})`);
    const guildKey = `guild:${guild.id}`;

    try {
      const channelIds = await redis.smembers(`${guildKey}:tempchannels`);
      const pipeline = redis.pipeline();

      // Remove all channel-related keys
      channelIds.forEach(channelId => {
        pipeline
          .del(`creator:${channelId}`)
          .del(`tlock:${channelId}`)
          .del(`hidden_state:${channelId}`)
          .del(`mute_state:${channelId}`)
          .del(`locked:${channelId}`)
          .del(`limit:${channelId}`)
          .del(`permitted_roles:${channelId}`)
          .del(`rejected_roles:${channelId}`)
          .del(`soundboard:${channelId}`);
      });

      // Remove guild-specific data
      pipeline
        .del(`${guildKey}:config`)
        .del(`${guildKey}:tempchannels`)
        .del(`${guildKey}:createChannel`);

      await pipeline.exec();
    } catch (err) {
      console.error(`Failed to clean Redis data for guild ${guild.id}:`, err);
    }
  }
}
