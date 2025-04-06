const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const path = require("path");
const noblox = require("noblox.js"); // Import Noblox.js for Roblox integration
const {
  checkWhitelist,
  handleNotWhitelisted,
  checkDatabaseAccess,
  handleDatabaseAccess,
} = require("../../checkwhitelist.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkall")
    .setDescription("Check all users against the sanguine group."),
  async execute(interaction) {
    // Check if the user is in the whitelist using checkwhitelist.js
    const wl = checkWhitelist(interaction.user.id);
    if (!wl) {
      handleNotWhitelisted(interaction);
      return;
    }
    if (wl) {
      const dbAccess = checkDatabaseAccess(interaction.user.id);
      if (!dbAccess) {
        handleDatabaseAccess(interaction);
        return;
      }
    }
    await interaction.deferReply({ ephemeral: true }); // Acknowledge command right away

    const blacklistedGroups = [
      34827610, // Crescent
      34827625, // Kyuketsuki
      34827596, // Rosa
      34827603, // Blessed
      35307220, // Profaned
      35612220, // Divine Order
    ];

    const filePath = path.join(__dirname, "../../../src/userdata.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);
    const sanguineGroupId = process.env.SANGUINE_ID
      ? Number(process.env.SANGUINE_ID)
      : null;
    let notInSanguine = [];

    for (const userData of data) {
      const username = userData.username;
      try {
        const userId = await noblox.getIdFromUsername(username);
        const userGroups = await noblox.getGroups(userId);

        const sanguineGroup = userGroups.find((g) => g.Id === sanguineGroupId);
        if (!sanguineGroup) {
          notInSanguine.push(username);
        }
      } catch (error) {
        console.error(`Failed to fetch data for ${username}:`, error);
        notInSanguine.push(`${username} (error)`);
      }
    }

    if (notInSanguine.length > 0) {
      await interaction.editReply({
        content: `The following users are not in the sanguine group: ${notInSanguine.join(
          ", "
        )}`,
      });
    } else {
      await interaction.editReply({
        content: "All users are in the sanguine group.",
      });
    }
  },
};
