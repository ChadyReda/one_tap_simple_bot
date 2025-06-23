const { redis } = require('../redisClient');
const { DEFAULT_CONFIG } = require('../utils/configManager');
const { REST, Routes, ChannelType } = require('discord.js');


module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);

    try {

      const category = await guild.channels.create({
        name: DEFAULT_CONFIG.tempChannelCategory,
        type: ChannelType.GuildCategory,
      })

      const channel = await guild.channels.create({
        name: DEFAULT_CONFIG.createChannelName,
        parent: category.id,
        type: 2
      })
      
      const initialConfig = {
        ...DEFAULT_CONFIG,
        createChannelId: channel.id,
        tempCahnnelCategoryId: category.id,
        guildId: guild.id
      };

      await redis.set(`guild:${guild.id}:config`, JSON.stringify(initialConfig));
      await redis.set(`guild:${guild.id}:createChannel`, channel.id);

      const rest = new REST({ version: '10' }).setToken(client.token);
      const commandsData = Array.from(client.commands.slash.values()).map(cmd => cmd.data.toJSON());
      const route = Routes.applicationGuildCommands(client.user.id, guild.id);
      const result = await rest.put(route, { body: commandsData });

      console.log(`⚡ Registered ${result.length} slash commands in ${guild.id}`);

    } catch (error) {
      console.error(`💀 Failed to setup guild ${guild.id}:`, error);
    }
  }
}
