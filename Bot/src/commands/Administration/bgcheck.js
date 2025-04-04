const fs = require("fs");
const path = require("path");
const noblox = require("noblox.js");
const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName("BG Check")
    .setType(ApplicationCommandType.User), // Marks this as a user context command

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const user = interaction.targetUser; // This is the right-clicked user
    const guildMember = await interaction.guild.members.fetch(user.id);
    const displayName = guildMember.displayName; // This is the display name in the guild

    try {
      await interaction.editReply({
        content: "Checking user...",
      });

      // Get Roblox user ID from the display name
      const userId = await noblox.getIdFromUsername(displayName);
      const userInfo = await noblox.getPlayerInfo(userId);
      const userGroups = await noblox.getGroups(userId);

      const sanguineGroupId = process.env.SANGUINE_ID
        ? Number(process.env.SANGUINE_ID)
        : null;

      const sanguineGroup = userGroups.find((g) => g.Id === sanguineGroupId);

      const sanguineGroupInfo = sanguineGroup
        ? `✅ Yes — Rank: ${sanguineGroup.Role}`
        : "❌ No";

      // Load userdata.json
      const filePath = path.join(__dirname, "../../../src/userdata.json");
      const fileContent = fs.readFileSync(filePath, "utf8");

      const data = JSON.parse(fileContent);
      const userData = data.find((entry) => entry.username === displayName);

      if (!userData) {
        await interaction.editReply({
          content: `User not found in the database.\n\n**Sanguine Group:** ${sanguineGroupInfo}`,
          ephemeral: false,
        });
        return;
      }

      // Embed response
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`User Check for ${displayName}`)
        .addFields(
          { name: "In Database", value: "✅ Yes", inline: true },
          { name: "In Sanguine Group", value: sanguineGroupInfo, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: "Conducted by: " + interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error checking user:", error);
      await interaction.editReply({
        content: "An error occurred while checking the user.",
        ephemeral: true,
      });
    }
  },
};
