module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    // Check if the interaction is a command
    if (!interaction.isCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    // Check if the command exists
    if (!command) {
      return interaction.reply({
        content: "❌ This command does not exist.",
        ephemeral: true,
      });
    }

    // Execute the command
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error("Error executing command:", error);
      await interaction.reply({
        content: "❌ An error occurred while executing this command.",
        ephemeral: true,
      });
    }
  },
};
