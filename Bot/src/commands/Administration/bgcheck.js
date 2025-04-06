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
    .setType(ApplicationCommandType.User),

  async execute(interaction) {
    let hasReplied = false;

    try {
      // Defer the reply — optional ephemeral flag
      await interaction.deferReply({ ephemeral: false }); // or { flags: 64 } for ephemeral
      hasReplied = true;

      // Ensure we're in a guild
      if (!interaction.guild) {
        return await interaction.editReply({
          content: "This command must be used inside a server.",
        });
      }

      // Fetch the target member and clean up the display name
      const user = interaction.targetUser;
      const guildMember = await interaction.guild.members.fetch(user.id);
      const displayName = guildMember.displayName;
      console.log("Display Name:", displayName);

      const cleanedUsername = displayName
        .match(/^([^\[\](){}]+)[\[\](){}]?.*$/)?.[1]
        ?.trim();

      if (!cleanedUsername) {
        return await interaction.editReply({
          content: "Could not extract a valid username from the display name.",
        });
      }

      await interaction.editReply({ content: "Checking user..." });

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
          {
            name: "In Sanguine Group",
            value: sanguineGroupInfo,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({
          text: "Conducted by: " + interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error("Error checking user:", error);

      const errorMsg = "An error occurred while checking the user.";

      if (hasReplied) {
        await interaction.editReply({ content: errorMsg });
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      }
    }
  },
};
