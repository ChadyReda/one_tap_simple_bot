const { redis, rateLimit } = require('../redisClient');
const { getGuildConfig } = require('../utils/configManager');
const { applyWhitelistToChannel, applyBlacklistToChannel } = require('../utils/UserListsHelper');

// Configuration
const CACHE_EXPIRATION_TIME = 30000; // 30 seconds
const configCache = new Map();

// Helper Functions
async function getCachedConfig(guildId) {
  const cached = configCache.get(guildId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const config = await getGuildConfig(guildId);
    configCache.set(guildId, {
      data: config,
      expiresAt: Date.now() + CACHE_EXPIRATION_TIME
    });
    return config;
  } catch (error) {
    console.error(`Failed to fetch config for guild ${guildId}:`, error);
    throw error;
  }
}

async function createTempChannel(state, guildId) {
  const { guild, member, channel } = state;

  try {
    // Check rate limit
    const isAllowed = await rateLimit(member.id, 'create_temp_channel', 2);
    if (!isAllowed) {
      // ❌ Revoke CONNECT permission
      await channel.permissionOverwrites.edit(member.id, {
        Connect: false
      }).catch(console.error);

      // 💬 Send message to chill
      try {
        await member.send(`⚠️ You're joining too fast. Chill for a bit before creating another voice channel.`)
          .catch(() => console.log(`Failed to DM ${member.user.tag}`));
      } catch (_) { }

      // 🔁 Re-enable after cooldown (e.g. 30 sec)
      setTimeout(() => {
        channel.permissionOverwrites.edit(member.id, {
          Connect: null // Reset to default
        }).catch(console.error);
      }, 30000); // or however long your rate limit window is

      // Optional: kick from voice
      await member.voice.disconnect().catch(console.error);

      return;
    }

    // Check user still in the join-to-create channel
    if (!member.voice.channelId || member.voice.channelId !== channel.id) {
      return;
    }

    // Create temp voice channel
    const tempChannel = await guild.channels.create({
      name: member.user.username,
      type: 2, // VOICE
      parent: channel.parentId || null
    });

    // Recheck user is still there before move
    if (!member.voice.channel || member.voice.channel.id !== channel.id) {
      await tempChannel.delete().catch(console.error);
      return;
    }

    // Try to move the member
    try {
      await member.voice.setChannel(tempChannel);
    } catch (moveError) {
      await tempChannel.delete().catch(console.error);
      if (moveError.code !== 10003) {
        console.error('Failed to move member to temp channel:', moveError);
      }
      return;
    }

    // Apply permissions + redis logic
    await queueSideEffects(tempChannel, member.id, guildId);

    // 🔁 Final delayed check (10 seconds later)
    setTimeout(async () => {
      try {
        const channelRefetch = await guild.channels.fetch(tempChannel.id).catch(() => null);
        if (!channelRefetch || channelRefetch.members.size === 0) {
          await cleanChannel(channelRefetch, guildId);
        }
      } catch (err) {
        console.error(`Final check cleanup failed for ${tempChannel.id}:`, err);
      }
    }, 5000); // 10 seconds
  } catch (error) {
    console.error('Error in createTempChannel:', error);
  }
}


async function queueSideEffects(channel, memberId, guildId) {
  try {
    // Redis operations
    await redis.pipeline()
      .set(`creator:${channel.id}`, memberId, 'EX', 86400)
      .sadd(`guild:${guildId}:tempchannels`, channel.id)
      .exec();

    // Apply permissions
    await Promise.all([
      applyWhitelistToChannel(channel, memberId),
      applyBlacklistToChannel(channel, memberId)
    ]);
  } catch (error) {
    console.error('Error in queueSideEffects:', error);
    await channel.delete().catch(console.error);
  }
}

async function cleanChannel(channel, guildId) {
  if (!channel || channel.deleted) return;

  try {
    const isTemp = await redis.sismember(`guild:${guildId}:tempchannels`, channel.id);
    if (!isTemp) return;

    const [channelFetch, creatorId] = await Promise.all([
      channel.guild.channels.fetch(channel.id).catch(() => null),
      redis.get(`creator:${channel.id}`).catch(() => null)
    ]);

    // Skip if channel doesn't exist, has members, or creator is present
    if (!channelFetch || channelFetch.members.size > 0 ||
      (creatorId && channelFetch.members.has(creatorId))) {
      return;
    }

    // Reset permissions and delete channel
    await channelFetch.permissionOverwrites.set([]);
    await channelFetch.delete();

    // Clean up Redis keys
    const keysToDelete = [
      `creator:${channel.id}`,
      `tlock:${channel.id}`,
      `hidden_state:${channel.id}`,
      `mute_state:${channel.id}`,
      `locked:${channel.id}`,
      `limit:${channel.id}`,
      `permitted_roles:${channel.id}`,
      `rejected_roles:${channel.id}`,
      `soundboard:${channel.id}`
    ];

    await redis.multi()
      .del(...keysToDelete)
      .srem(`guild:${guildId}:tempchannels`, channel.id)
      .srem(`transferred:${creatorId}`, channel.id)
      .exec()
      .catch(console.error);
  } catch (error) {
    console.error('Error in cleanChannel:', error);
  }
}

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    if (oldState.channelId === newState.channelId) return;

    try {
      const guildId = newState.guild?.id || oldState.guild.id;
      const config = await getCachedConfig(guildId);

      if (newState.channel?.id === config.createChannelId) {
        await createTempChannel(newState, guildId);
      }

      if (oldState.channelId) {
        await cleanChannel(oldState.channel, guildId);
      }
    } catch (error) {
      console.error('Error in voiceStateUpdate:', error);
    }
  }
};