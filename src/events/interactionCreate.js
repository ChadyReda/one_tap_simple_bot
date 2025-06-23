module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.slash.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
        }
    }
}