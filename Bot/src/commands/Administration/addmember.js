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
    .setName("addmember")
    .setDescription("Add a member to the database.")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The username of the user to add.")
        .setRequired(true)
    ),
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
    const blacklistedGroups = [
      34827610, // Crescent
      34827625, // Kyuketsuki
      34827596, // Rosa
      34827603, // Blessed
      35307220, // Profaned
      35612220, // Divine Order
    ];

    //Check if the user is in the database
    const filePath = path.join(__dirname, "../../../src/userdata.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);
    const username = interaction.options.getString("username");
    const userData = data.find((user) => user.username === username);
    if (userData) {
      await interaction.reply({
        content: "User already exists in the database.",
        ephemeral: true,
      });
      return;
    } else {
      // Check if the user is in the sanguine group
      // Get the user ID from the username
      const userId = await noblox.getIdFromUsername(username);
      const player = await noblox.getUserInfo(userId);
      const userGroups = await noblox.getGroups(userId);

      const sanguineGroupId = process.env.SANGUINE_ID
        ? Number(process.env.SANGUINE_ID)
        : null;
      const sanguineGroup = userGroups.find((g) => g.Id === sanguineGroupId);
      if (!sanguineGroup) {
        await interaction.reply({
          content: "User is not in the sanguine group.",
          ephemeral: true,
        });
        return;
      }

      // Check if the user is in a blacklisted group
      const blacklistedMemberships = userGroups.filter((group) =>
        blacklistedGroups.includes(group.Id)
      );
      const isBlacklisted = blacklistedMemberships.length > 0;
      if (isBlacklisted) {
        await interaction.reply({
          content: "User is in a blacklisted group.",
          ephemeral: true,
        });
        return;
      }

      const mainGroupId = process.env.MAINGROUP_ID
        ? Number(process.env.MAINGROUP_ID)
        : null;

      const mainGroup = userGroups.find((g) => g.Id === mainGroupId);

      let groupStatus = "";
      if (sanguineGroup && mainGroup) {
        groupStatus = "Sanguine and Sanguophage";
      } else if (sanguineGroup) {
        groupStatus = "Sanguine";
      } else if (mainGroup) {
        groupStatus = "Sanguophage";
      }

      // Add user to the database
      const newUser = {
        username: player.name,
        displayName: player.displayName,
        mainGroup: mainGroup
          ? { name: mainGroup.Name, role: mainGroup.Role }
          : null,
        sanguineGroup: sanguineGroup
          ? { name: sanguineGroup.Name, role: sanguineGroup.Role }
          : null,
        groupStatus, // Set the group status
        rank: "Member", // Update rank logic
        attendedEvents: 0, // Update based on your needs
      };
      data.push(newUser);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      await interaction.reply({
        content: `User ${username} added to the database.`,
        ephemeral: false,
      });
    }
  },
};
