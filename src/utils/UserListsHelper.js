const { redis } = require('../redisClient');


async function applyWhitelistToChannel(voiceChannel, creatorId) {
  try {
    const whitelistKey = `vc:whitelist:${creatorId}`;
    const whitelistedIds = await redis.smembers(whitelistKey);
    
    if (whitelistedIds.length === 0) return;
    
    // Apply permissions for each whitelisted user
    for (const userId of whitelistedIds) {
      try {
        await voiceChannel.permissionOverwrites.edit(userId, {
          Connect: true,
          ViewChannel: true
        });
      } catch (error) {
        return
      }
    }
  } catch (error) {
    console.error('Error applying whitelist to channel:', error);
  }
}

async function applyBlacklistToChannel(voiceChannel, creatorId) {
  try {
    const blacklistKey = `vc:blacklist:${creatorId}`;
    const blacklistedIds = await redis.smembers(blacklistKey);
    
    if (blacklistedIds.length === 0) return;
    
    // Apply permissions for each blacklisted user
    for (const userId of blacklistedIds) {
      try {
        await voiceChannel.permissionOverwrites.edit(userId, {
          Connect: false,
          ViewChannel: false
        });
      } catch (error) {
        return
      }
    }
    
  } catch (error) {
    console.error('Error applying blacklist to channel:', error);
  }
}



module.exports = {
  applyWhitelistToChannel,
  applyBlacklistToChannel
}