const noblox = require("noblox.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const env = require("dotenv").config();
const {
  checkWhitelist,
  handleNotWhitelisted,
  checkRankChangesAccess,
  handleRankChangesAccess,
} = require("../../checkwhitelist.js");
const { logAction } = require("../../loguseage.js");

const rankOptions = [
  { name: "♟ - Thrall of Sanguine - ♟", value: 1 },
  { name: "♟ - Trickster - ♟", value: 2 },
  { name: "♟ - Jester - ♟", value: 3 },
  { name: "♟ - Harlequin - ♟", value: 4 },
  { name: "♜ - Strongman - ♜", value: 5 },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changerank")
    .setDescription(
      "Set a user's rank in the Roblox group to a specific role. THIS IS DIFFERENT THAN PROMOTE!"
    )
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The Roblox username of the person to rank")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("rank")
        .setDescription("Select the rank to assign")
        .setRequired(true)
        .addChoices(
          ...rankOptions.map((rank) => ({ name: rank.name, value: rank.value }))
        )
    ),

  async execute(interaction) {
    const discordID = interaction.user.id;

    // ✅ Check whitelist and permission
    if (!checkWhitelist(discordID)) return handleNotWhitelisted(interaction);
    if (!checkRankChangesAccess(discordID))
      return handleRankChangesAccess(interaction);

    const username = interaction.options.getString("username");
    const rank = interaction.options.getInteger("rank");
    const groupId = process.env.SANGUINE_ID;

    const rankName =
      rankOptions.find((r) => r.value === rank)?.name || `Rank ID ${rank}`;

    try {
      const userId = await noblox.getIdFromUsername(username);
      const currentRank = await noblox.getRankInGroup(groupId, userId);
      
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

      if (currentRank === rank) {
        const sameRankEmbed = new EmbedBuilder()
          .setColor("Yellow")
          .setTitle("No Change Made")
          .setDescription(
            `⚠️ **${username}** is already ranked to **${rankName}**. No changes were made.`
          )
          .setTimestamp()
          .setFooter({ text: "Sanguine" });

        logAction(
          interaction,
          discordID,
          "Change Rank",
          `Requested to rank **${username}** to **${rankName}**`,
          "⚠️ No change: user already had the target rank"
        );

        return await interaction.reply({
          embeds: [sameRankEmbed],
          ephemeral: true,
        });
      }

      await noblox.setRank(groupId, userId, rank);

      logAction(
        interaction,
        discordID,
        "Change Rank",
        `Requested to rank **${username}** to **${rankName}**`,
        "✅ Rank changed successfully"
      );

      const successEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Rank Set Successfully")
        .setDescription(
          `✅ **${username}** has been ranked to **${rankName}**.`
        )
        .setTimestamp()
        .setFooter({ text: "Sanguine" });

      await interaction.reply({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Failed to set rank:", error);

      const failEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Rank Change Failed")
        .setDescription(
          "⚠️ Something went wrong. Make sure the username is correct and the user is in the group."
        )
        .setTimestamp()
        .setFooter({ text: "Sanguine" });

      logAction(
        interaction,
        discordID,
        "Change Rank",
        `Requested to rank **${username}** to **${rankName}**`,
        "❌ Rank change failed"
      );

      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  },
};
