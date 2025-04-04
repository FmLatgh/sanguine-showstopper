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
    .setType(ApplicationCommandType.User), // Right-click user command

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const user = interaction.targetUser;
    const guildMember = await interaction.guild.members.fetch(user.id);
    const displayName = guildMember.displayName;
    console.log("Display Name:", displayName);

    // Extract username before any tags like [☥]
    const cleanedUsername = displayName
      .match(/^([^\[\](){}]+)[\[\](){}]?.*$/)?.[1]
      ?.trim();

    try {
      await interaction.editReply({
        content: "Checking user...",
      });

      const userId = await noblox.getIdFromUsername(cleanedUsername);
      const userInfo = await noblox.getPlayerInfo(userId);
      const userGroups = await noblox.getGroups(userId);

      const sanguineGroupId = process.env.SANGUINE_ID
        ? Number(process.env.SANGUINE_ID)
        : null;

      const sanguineGroup = userGroups.find((g) => g.Id === sanguineGroupId);
      const sanguineGroupInfo = sanguineGroup
        ? `✅ Yes — Rank: ${sanguineGroup.Role}`
        : "❌ No";

      const filePath = path.join(__dirname, "../../../src/userdata.json");
      const fileContent = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(fileContent);

      const userData = data.find((entry) => entry.username === cleanedUsername);

      const embed = new EmbedBuilder()
        .setColor(userData ? "#0099ff" : "#ff0000")
        .setTitle(`User Check for ${cleanedUsername}`)
        .addFields(
          {
            name: "In Database",
            value: userData ? "✅ Yes" : "❌ No",
            inline: true,
          },
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
