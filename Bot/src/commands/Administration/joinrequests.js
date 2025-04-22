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
    .setName("joinrequests")
    .setDescription("Manage join requests for the group.")
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("The action to perform.")
        .setRequired(true)
        .addChoices(
          { name: "Accept", value: "accept" },
          { name: "Deny", value: "deny" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The username of the user to accept or deny.")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!checkWhitelist(interaction.user.id)) {
      await handleNotWhitelisted(interaction);
      logAction(
        interaction,
        interaction.user.id,
        "joinrequests",
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
        "joinrequests",
        "No Access",
        "❌ Failed"
      );
      return;
    }

    const action = interaction.options.getString("action");
    const username = interaction.options.getString("username");
    const isAccept = action.toLowerCase() === "accept";

    const embed = new EmbedBuilder()
      .setColor(isAccept ? "#00b300" : "#cc0000")
      .setTitle(`${isAccept ? "Accept" : "Deny"} Join Request`)
      .setDescription(
        `Are you sure you want to **${action}** **${username}**'s join request?\nThis action cannot be undone.`
      )
      .setFooter({ text: "You have 30 seconds to respond." });

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel(isAccept ? "Accept" : "Deny")
        .setStyle(isAccept ? ButtonStyle.Success : ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      filter: (btnInt) =>
        btnInt.user.id === interaction.user.id &&
        ["confirm", "cancel"].includes(btnInt.customId),
      time: 30000,
    });

    collector.on("collect", async (buttonInteraction) => {
      await buttonInteraction.deferUpdate();

      if (buttonInteraction.customId === "cancel") {
        await interaction.editReply({
          content: "❌ Action cancelled.",
          embeds: [],
          components: [],
        });
        return;
      }

      try {
        const userId = await noblox.getIdFromUsername(username);

        // Check if user has a pending join request
        const joinRequests = await noblox.getJoinRequests(
          Number(process.env.SANGUINE_ID)
        );
        const userRequest = joinRequests.data.find(
          (req) => req.requester.userId === userId
        );

        if (!userRequest) {
          await interaction.editReply({
            content: `❌ **${username}** does not have a pending join request.`,
            embeds: [],
            components: [],
          });

          logAction(
            interaction,
            interaction.user.id,
            "joinrequests",
            `No join request found for ${username}`,
            "❌ Failed"
          );

          return;
        }

        // Proceed to accept or deny
        await noblox.handleJoinRequest(
          Number(process.env.SANGUINE_ID),
          userId,
          isAccept
        );

        await interaction.editReply({
          content: `✅ Successfully ${
            isAccept ? "accepted" : "denied"
          } **${username}**'s join request.`,
          embeds: [],
          components: [],
        });

        logAction(
          interaction,
          interaction.user.id,
          "joinrequests",
          `${isAccept ? "Accepted" : "Denied"} join request for ${username}`,
          "✅ Success"
        );
      } catch (error) {
        console.error(error);
        await interaction.editReply({
          content: `❌ Failed to ${action} join request for **${username}**.\nError: ${error.message}`,
          embeds: [],
          components: [],
        });

        logAction(
          interaction,
          interaction.user.id,
          "joinrequests",
          `Failed to ${action} join request for ${username}`,
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
