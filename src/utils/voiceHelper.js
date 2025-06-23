const { redis } = require('./redisClient');

async function isChannelOwner(channelId, userId) {
  const ownerId = await redis.get(`creator:${channelId}`);
  return ownerId === userId;
}

async function transferOwnership(channelId, newOwnerId) {
  const pipeline = redis.pipeline();
  pipeline.set(`creator:${channelId}`, newOwnerId);
  pipeline.expire(`creator:${channelId}`, 86400);
  await pipeline.exec();
}

async function checkOwnership(channelId, userId) {
  const ownerId = await redis.get(`creator:${channelId}`);
  return ownerId === userId;
}

async function getChannelState(channelId, stateType) {
  return redis.get(`${stateType}_state:${channelId}`);
}

async function getChannelSetting(channelId, setting) {
  return redis.get(`${setting}:${channelId}`);
}

async function getChannelOwner(channelId) {
  return redis.get(`creator:${channelId}`);
}

async function getPermittedRoles(channelId) {
  return redis.smembers(`permitted_roles:${channelId}`);
}

async function getRejectedUsers(channelId) {
  return redis.smembers(`rejected_users:${channelId}`);
}

async function getRejectedRoles(channelId) {
  return redis.smembers(`rejected_roles:${channelId}`);
}

async function getSoundboardState(channelId) {
  return redis.get(`soundboard:${channelId}`);
}

async function getPendingRequests(channelId) {
  return redis.smembers(`access_requests:${channelId}`);
}

async function getChannelStatus(channelId) {
  return redis.get(`status:${channelId}`);
}

async function isTextLocked(channelId) {
  return redis.get(`tlock:${channelId}`) === '1';
}

async function getTransferredChannels(userId) {
  return redis.smembers(`transferred:${userId}`);
}

module.exports = {
  isChannelOwner,
  transferOwnership,
  checkOwnership,
  getChannelState,
  getChannelSetting,
  getChannelOwner,
  getPermittedRoles,
  getRejectedRoles,
  getRejectedUsers,
  getSoundboardState,
  getPendingRequests,
  getChannelStatus,
  isTextLocked,
  getTransferredChannels,
};