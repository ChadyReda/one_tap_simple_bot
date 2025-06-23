const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { updateGuildConfig, getGuildConfig } = require('../../utils/configManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up the temporary voice channel system')
    .addStringOption(option =>
      option.setName('create-channel-name')
        .setDescription('Name of the channel users will join to create temp channels')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('Category to create temporary voice channels in')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.reply({
        content: 'D - You need the **Manage Server** permission to use this command.',
        ephemeral: true
      });
    }

    const guild = interaction.guild;
    const channelName = interaction.options.getString('create-channel-name');
    const category = interaction.options.getChannel('category');
    const prevConfig = await getGuildConfig(guild.id);

    if (prevConfig?.createChannelId) {
      try {
        const oldChannel = await guild.channels.fetch(prevConfig.createChannelId);
        if (oldChannel) await oldChannel.delete();
      } catch (error) {
        
      }
    }

    let createChannel = guild.channels.cache.find(c =>
      c.name === channelName && c.type === ChannelType.GuildVoice
    );

    if (!createChannel) {
      try {
        createChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [{
            id: guild.roles.everyone,
            allow: [PermissionsBitField.Flags.Connect],
          }]
        });
      } catch {
        return interaction.reply({
          content: 'E - failed to create temp channel | check perms.',
          ephemeral: true
        });
      }
    }

    const newConfig = {
      createChannelName: createChannel.name,
      createChannelId: createChannel.id,
      tempChannelCategory: category.id
    };

    const updatedConfig = await updateGuildConfig(guild.id, newConfig);

    await interaction.reply({
      content: `✅ Setup complete. Configuration:\n\`\`\`json\n${JSON.stringify(updatedConfig, null, 2)}\n\`\`\``,
      ephemeral: true
    });
  }
};
