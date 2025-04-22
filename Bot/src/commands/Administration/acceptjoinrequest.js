const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const noblox = require("noblox.js");
const {
  checkWhitelist,
  handleNotWhitelisted,
  checkRankChangesAccess,
  handleRankChangesAccess,
} = require("../../checkwhitelist.js");
const { logAction } = require("../../loguseage.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("acceptjoinrequest")
    .setDescription("Accepts a join request from a specific user.")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The username of the user to accept.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!checkWhitelist(interaction.user.id)) {
      await handleNotWhitelisted(interaction);
      logAction(
        interaction,
        interaction.user.id,
        "acceptjoinrequest",
        "Not Whitelisted",
        "❌ Failed"
      );
      return;
    }

    if (!checkRankChangesAccess(interaction.user.id)) {
      await handleRankChangesAccess(interaction);
      logAction(
        interaction,
        interaction.user.id,
        "acceptjoinrequest",
        "No Access",
        "❌ Failed"
      );
      return;
    }

    const username = interaction.options.getString("username");

    const confirmationEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Accept Join Request")
      .setDescription(
        `Are you sure you want to accept **${username}**'s join request?\nThis action cannot be undone.`
      )
      .setFooter({ text: "You have 30 seconds to respond." });

    const confirmationRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("accept")
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [confirmationEmbed],
      components: [confirmationRow],
      ephemeral: true,
    });

    const message = await interaction.fetchReply(); // fetch the ephemeral message

    const collector = message.createMessageComponentCollector({
      filter: (btnInt) =>
        btnInt.user.id === interaction.user.id &&
        ["accept", "cancel"].includes(btnInt.customId),
      time: 30000,
    });

    collector.on("collect", async (buttonInteraction) => {
      await buttonInteraction.deferUpdate();

      if (buttonInteraction.customId === "cancel") {
        await interaction.editReply({
          content: "❌ Cancelled accepting the join request.",
          embeds: [],
          components: [],
        });
        return;
      }

      try {
        const userId = await noblox.getIdFromUsername(username);
        await noblox.handleJoinRequest(
          Number(process.env.SANGUINE_ID),
          userId,
          true
        );

        await interaction.editReply({
          content: `✅ Successfully accepted **${username}**'s join request.`,
          embeds: [],
          components: [],
        });

        logAction(
          interaction,
          interaction.user.id,
          "acceptjoinrequest",
          `Accepted join request for ${username}`,
          "✅ Success"
        );
      } catch (error) {
        console.error(error);
        await interaction.editReply({
          content: `❌ Failed to accept join request for **${username}**.\nError: ${error.message}`,
          embeds: [],
          components: [],
        });

        logAction(
          interaction,
          interaction.user.id,
          "acceptjoinrequest",
          `Failed to accept join request for ${username}`,
          "❌ Error"
        );
      }

      collector.stop();
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        await interaction.editReply({
          content: "⌛ Confirmation timed out.",
          embeds: [],
          components: [],
        });
      }
    });
  },
};
