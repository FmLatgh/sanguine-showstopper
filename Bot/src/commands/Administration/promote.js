const noblox = require("noblox.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
} = require("discord.js");
const env = require("dotenv").config();
const {
  checkWhitelist,
  handleNotWhitelisted,
  checkRankChangesAccess,
  handleRankChangesAccess,
} = require("../../checkwhitelist.js");
const { logAction } = require("../../loguseage.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promote a user to the next rank in the Roblox group.")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The Roblox username of the person to promote")
        .setRequired(true)
    ),

  async execute(interaction) {
    const discordID = interaction.user.id;

    if (!checkWhitelist(discordID)) return handleNotWhitelisted(interaction);
    if (!checkRankChangesAccess(discordID))
      return handleRankChangesAccess(interaction);

    const username = interaction.options.getString("username");
    const groupId = process.env.SANGUINE_ID;
    const botAuthorId = process.env.BOT_AUTHOR;

    try {
      const userId = await noblox.getIdFromUsername(username);
      const currentRank = await noblox.getRankInGroup(groupId, userId);
      const roles = await noblox.getRoles(groupId);
      const currentRoleIndex = roles.findIndex((r) => r.rank === currentRank);

      if (currentRank === 0) {
        const guestEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("User Not in Group")
          .setDescription(
            `⚠️ **${username}** is not in the group and cannot be ranked.`
          )
          .setTimestamp()
          .setFooter({ text: "Sanguine" });

        logAction(
          interaction,
          discordID,
          "Change Rank",
          `Tried to rank **${username}** to **${rankName}**`,
          "❌ Failed - user not in group"
        );

        return await interaction.reply({
          embeds: [guestEmbed],
          ephemeral: true,
        });
      }

      if (currentRoleIndex + 1 >= roles.length) {
        const invalidEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("Promotion Failed")
          .setDescription(
            `⚠️ **${username}** cannot be promoted. They may be at the highest rank or not in the group.`
          )
          .setTimestamp()
          .setFooter({ text: "Sanguine" });

        await interaction.reply({ embeds: [invalidEmbed], ephemeral: true });
        return;
      }

      const nextRole = roles[currentRoleIndex + 1];

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm_promotion")
          .setLabel(`Yes, promote to ${nextRole.name}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cancel_promotion")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger)
      );

      const confirmEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("Confirm Promotion")
        .setDescription(
          `Are you sure you want to promote **${username}** from **${roles[currentRoleIndex].name}** to **${nextRole.name}**?`
        )
        .setTimestamp()
        .setFooter({ text: "Sanguine" });

      const message = await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmRow],
        ephemeral: true,
        fetchReply: true,
      });

      const filter = (i) =>
        i.user.id === interaction.user.id &&
        ["confirm_promotion", "cancel_promotion"].includes(i.customId);

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 15000,
        max: 1,
        filter,
      });

      collector.on("collect", async (btnInteraction) => {
        if (btnInteraction.customId === "cancel_promotion") {
          await btnInteraction.update({
            content: "❌ Promotion cancelled.",
            components: [],
            embeds: [],
          });

          logAction(
            interaction,
            discordID,
            "Promote",
            `Requested to promote **${username}**`,
            "❌ Cancelled by user"
          );
        } else if (btnInteraction.customId === "confirm_promotion") {
          try {
            await noblox.setRank(groupId, userId, nextRole.rank);

            const successEmbed = new EmbedBuilder()
              .setColor("Green")
              .setTitle("Promotion Successful")
              .setDescription(
                `✅ **${username}** has been promoted to **${nextRole.name}**.`
              )
              .setTimestamp()
              .setFooter({ text: "Sanguine" });

            await btnInteraction.update({
              embeds: [successEmbed],
              components: [],
              content: "",
            });

            logAction(
              interaction,
              discordID,
              "Promote",
              `Requested to promote **${username}** to **${nextRole.name}**`,
              "✅ Promotion successful"
            );

            // 📨 DM the bot author if the rank is above 6
            if (nextRole.rank > 6) {
              const authorUser = await interaction.client.users.fetch(
                botAuthorId
              );
              const alertEmbed = new EmbedBuilder()
                .setColor("Orange")
                .setTitle("⚠️ High-Level Promotion Alert")
                .addFields(
                  { name: "Promoted User", value: `${username}` },
                  {
                    name: "New Rank",
                    value: `${nextRole.name} (Rank ${nextRole.rank})`,
                  },
                  { name: "Promoted By", value: `<@${interaction.user.id}>` },
                  {
                    name: "Time",
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                  }
                )
                .setFooter({ text: "Sanguine Bot System" });

              await authorUser
                .send({ embeds: [alertEmbed] })
                .catch(console.error);
            }
          } catch (err) {
            console.error("Failed to promote user:", err);

            const failEmbed = new EmbedBuilder()
              .setColor("Red")
              .setTitle("Promotion Failed")
              .setDescription(
                "⚠️ Something went wrong while trying to promote the user."
              )
              .setTimestamp()
              .setFooter({ text: "Sanguine" });

            await btnInteraction.update({
              embeds: [failEmbed],
              components: [],
              content: "",
            });

            logAction(
              interaction,
              discordID,
              "Promote",
              `Requested to promote **${username}** to **${nextRole.name}**`,
              "❌ Promotion failed"
            );
          }
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          await interaction.editReply({
            content: "⌛ Promotion request timed out.",
            embeds: [],
            components: [],
          });

          logAction(
            interaction,
            discordID,
            "Promote",
            `Requested to promote **${username}**`,
            "⌛ Timed out"
          );
        }
      });
    } catch (error) {
      console.error("Error during promotion:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Promotion Error")
        .setDescription(
          "⚠️ Could not fetch user data. Ensure the username is valid and the user is in the group."
        )
        .setTimestamp()
        .setFooter({ text: "Sanguine" });

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
