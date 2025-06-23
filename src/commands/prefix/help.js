const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Display all voice channel commands with pagination',
  usage: '.v help',
  async execute(message, args, client) {
    const feather = '🪶';

    const pages = [
      new EmbedBuilder()
        .setTitle('📘 Channel Settings')
        .setColor(0x5865F2)
        .setDescription([
          `${feather} \`name\` - Change the VC name (2x/10min)`,
          `${feather} \`status\` - Set a status (emoji + text)`,
          `${feather} \`limit\` - Set VC user limit`,
          `${feather} \`reset\` - Reset VC to default`,
          `${feather} \`vcinfo\` - Show VC info`
        ].join('\n')),
      
      new EmbedBuilder()
        .setTitle('🔐 Access & Permissions')
        .setColor(0x5865F2)
        .setDescription([
          `${feather} \`lock\` / \`unlock\` - Lock/unlock one-tap`,
          `${feather} \`hide\` / \`unhide\` - Hide/unhide VC`,
          `${feather} \`permit\` / \`reject\` - Allow/deny users`,
          `${feather} \`permitrole\` / \`rejectrole\` - Allow/deny roles`,
          `${feather} \`request\` - Ask to join a locked VC`,
          `${feather} \`tlock\` / \`tunlock\` - Lock/unlock VC chat`
        ].join('\n')),

      new EmbedBuilder()
        .setTitle('👥 User Management')
        .setColor(0x5865F2)
        .setDescription([
          `${feather} \`kick\` - Kick user from VC`,
          `${feather} \`mute\` / \`unmute\` - Mute/unmute a user`,
          `${feather} \`fm\` / \`funm\` - Mute/unmute all`,
          `${feather} \`claim\` - Take over VC if owner left`,
          `${feather} \`transfer\` - Transfer ownership`,
          `${feather} \`owner\` - Show VC owner`
        ].join('\n')),

      new EmbedBuilder()
        .setTitle('🎮 Feature Controls')
        .setColor(0x5865F2)
        .setDescription([
          `${feather} \`activity\` - Toggle Activities`,
          `${feather} \`cam\` - Toggle camera access`,
          `${feather} \`stream\` - Toggle stream access`,
          `${feather} \`sb\` - Toggle soundboard`
        ].join('\n')),

      new EmbedBuilder()
        .setTitle('🧠 Usage Tips')
        .setColor(0x5865F2)
        .setDescription('Use `.v <command>` inside a temporary voice channel you created.\n\nExample:\n```\n.v name Chill Zone\n.v limit 5\n.v lock\n```')
    ];

    let page = 0;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('◀').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('▶').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('stop').setLabel('⛔').setStyle(ButtonStyle.Danger)
    );

    const reply = await message.reply({ embeds: [pages[page]], components: [row] });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id)
        return interaction.reply({ content: '❌ Only the command author can use these buttons.', ephemeral: true });

      switch (interaction.customId) {
        case 'prev':
          page = (page - 1 + pages.length) % pages.length;
          break;
        case 'next':
          page = (page + 1) % pages.length;
          break;
        case 'stop':
          collector.stop();
          return await interaction.update({ components: [] });
      }

      await interaction.update({ embeds: [pages[page]], components: [row] });
    });

    collector.on('end', async () => {
      try {
        await reply.edit({ components: [] });
      } catch (_) {}
    });
  }
};
