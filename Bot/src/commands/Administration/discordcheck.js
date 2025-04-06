const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const path = require("path");
const noblox = require("noblox.js"); // Import Noblox.js for Roblox integration
const {
  checkWhitelist,
  handleNotWhitelisted,
} = require("../../checkwhitelist.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("discordcheck")
    .setDescription(
      "Check if this user is in the database and in the sanguine group."
    )
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The username of the user to check.")
        .setRequired(true)
    ),
  async execute(interaction) {
    // Check if the user is in the whitelist using checkwhitelist.js
    const wl = checkWhitelist(interaction.user.id);
    if (!wl) {
      handleNotWhitelisted(interaction);
      return;
    }
    await interaction.deferReply({ ephemeral: false });
    const username = interaction.options.getString("username");

    try {
      await interaction.editReply({
        content: "Checking user...",
      });

      // Get the user ID from the username
      const userId = await noblox.getIdFromUsername(username);
      const userInfo = await noblox.getPlayerInfo(userId);
      const userGroups = await noblox.getGroups(userId);

      // Define group ID
      const sanguineGroupId = process.env.SANGUINE_ID
        ? Number(process.env.SANGUINE_ID)
        : null;

      const sanguineGroup = userGroups.find((g) => g.Id === sanguineGroupId);

      const sanguineGroupInfo = sanguineGroup
        ? `✅ Yes — Rank: ${sanguineGroup.Role}`
        : "❌ No";

      //get the userdata.json file
      const filePath = path.join(__dirname, "../../../src/userdata.json");
      const fileContent = fs.readFileSync(filePath, "utf8");

      const data = JSON.parse(fileContent);
      const userData = data.find((user) => user.username === username);

      if (!userData) {
        await interaction.editReply({
          content: `User not found in the database, therefore not in the  discord.\n\n**Sanguine Group:** ${sanguineGroupInfo}`,
          ephemeral: false,
        });
        return;
      }
    } catch (error) {
      console.error("Error checking user:", error);
      await interaction.editReply({
        content: "An error occurred while checking the user.",
        ephemeral: true,
      });
    }
  },
};
