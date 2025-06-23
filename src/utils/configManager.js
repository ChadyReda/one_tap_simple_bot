const { redis } = require('../redisClient');

const DEFAULT_CONFIG = {
  createChannelName: '➕ Create Temp Channel',
  createChannelId: null,
  tempChannelCategory: 'Temporary Channels',
  tempCahnnelCategoryId: null,
  autoDeleteEmpty: true,
  allowRenaming: true,
  defaultUserLimit: 0
};

async function getGuildConfig(guildId) {
  const config = await redis.get(`guild:${guildId}:config`);
  return config ? JSON.parse(config) : { ...DEFAULT_CONFIG };
}

async function updateGuildConfig(guildId, newConfig) {
  const currentConfig = await getGuildConfig(guildId);
  const mergedConfig = { ...currentConfig, ...newConfig };
  await redis.set(`guild:${guildId}:config`, JSON.stringify(mergedConfig));
  return mergedConfig;
}

async function resetGuildConfig(guildId) {
  await redis.set(`guild:${guildId}:config`, JSON.stringify(DEFAULT_CONFIG));
  return DEFAULT_CONFIG;
}

module.exports = {
  DEFAULT_CONFIG,
  getGuildConfig,
  updateGuildConfig,
  resetGuildConfig
};