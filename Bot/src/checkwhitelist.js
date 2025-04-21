const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

// This function checks if the user is in the whitelist.
function checkWhitelist(discordID) {
  const whitelistFilePath = path.join(__dirname, "whitelist.json");
  const whitelistData = fs.readFileSync(whitelistFilePath, "utf8");
  const whitelist = JSON.parse(whitelistData);

  // Check if the user ID is a key in the whitelist object
  return discordID in whitelist;
}

// This function handles the response if the user is not in the whitelist.
function handleNotWhitelisted(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("Access Denied")
    .setDescription(
      "You are not whitelisted to use this command. Your rank is `GUEST`. Minimum rank required is `USER`. \n\nIf you believe this is a mistake, please contact <@489812483662544906> **directly**."
    )
    .setTimestamp()
    .setFooter({ text: "Sanguine" });

  interaction.reply({ embeds: [embed], ephemeral: true });
}

// This function checks if the user has database authorization based on their discordID.
function checkDatabaseAccess(discordID) {
  const databaseFilePath = path.join(__dirname, "whitelist.json");
  const databaseData = fs.readFileSync(databaseFilePath, "utf8");
  const database = JSON.parse(databaseData);

  // Check if the user ID is a key in the database object
  if (discordID in database) {
    // Check if the DatabaseAuthorization for this user is "true"
    return database[discordID].DatabaseAuthorization === "true";
  }

  return false; // Return false if the user is not found in the database
}

function handleDatabaseAccess(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("Access Denied")
    .setDescription(
      "You are not authorized to use this command. I didn't give anyone access to this command on purpose. Please contact me here if you think you can have this kind of permission in good faith: <@489812483662544906> \n\n -Patron"
    )
    .setTimestamp()
    .setFooter({ text: "Sanguine" });

  interaction.reply({ embeds: [embed], ephemeral: true });
}

function checkRankChangesAccess(discordID) {
  const databaseFilePath = path.join(__dirname, "whitelist.json");
  const databaseData = fs.readFileSync(databaseFilePath, "utf8");
  const database = JSON.parse(databaseData);

  // Check if the user ID is a key in the database object
  if (discordID in database) {
    // Check if the RankChangesAuthorization for this user is "true"
    return database[discordID].RankChangesAuthorization === "true";
  }

  return false; // Return false if the user is not found in the database
}

function handleRankChangesAccess(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("Access Denied")
    .setDescription(
      "You are not authorized to use this command. If you are a Showmaster+ and do not have access, DM me at: <@489812483662544906> \n\n -Patron"
    )
    .setTimestamp()
    .setFooter({ text: "Sanguine" });

  interaction.reply({ embeds: [embed], ephemeral: true });
}

// Export the functions
module.exports = {
  checkWhitelist,
  handleNotWhitelisted,
  checkDatabaseAccess,
  handleDatabaseAccess,
  checkRankChangesAccess,
  handleRankChangesAccess,
};
