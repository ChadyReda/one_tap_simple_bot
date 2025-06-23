const { REST, Routes } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(client.token);
    const commandsData = Array.from(client.commands.slash.values()).map(cmd => cmd.data.toJSON());
    const useGlobal = process.env.USE_GLOBAL === 'true';

    try {
      if (useGlobal) {

        // global registration
        const route = Routes.applicationCommands(client.user.id);
        const result = await rest.put(route, { body: commandsData });
        console.log(`🌐 Registered ${result.length} global slash commands.`);
        console.log('⚠️ Global commands may take up to 1 hour to appear in all servers.');

      } else {
        // guild registration - fast
        const guilds = client.guilds.cache.map(guild => guild.id);
        console.log(`🔁 Registering slash commands in ${guilds.length} guilds...`);

        for (const guildId of guilds) {
          const route = Routes.applicationGuildCommands(client.user.id, guildId);
          const result = await rest.put(route, { body: commandsData });
          console.log(`✅ Registered ${result.length} commands in guild ${guildId}`);
        }
      }
    } catch (err) {
      console.error('💀 Failed to register commands:', err);
    }
  }
};
