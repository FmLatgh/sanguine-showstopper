const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const {
  checkWhitelist,
  handleNotWhitelisted,
} = require("../../checkwhitelist.js");
const { logAction } = require("../../loguseage.js"); // Import logAction function

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Get information about the bot."),
  async execute(interaction) {
    // Check if the user is in the whitelist using checkwhitelist.js
    const wl = checkWhitelist(interaction.user.id);
    if (!wl) {
      handleNotWhitelisted(interaction);
      logAction(
        interaction,
        interaction.user.id,
        "botinfo",
        "User not whitelisted",
        "Failed"
      ); // Log the action
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    // Read data from whitelist.json
    const filePath = path.join(__dirname, "../../../src/whitelist.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    const userId = interaction.user.id;

    // Extract user information from whitelist.json
    const userData = data[userId];
    const username = userData.name;
    const rank = userData.rank;
    const databaseAuthorization = userData.DatabaseAuthorization === "true";
    const rankChangesAccess = userData.RankChangesAccess === "true";

    // Create the embed message
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Bot Information")
      .setDescription("Hi " + username + "! Here is your information:")
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: "Username", value: username, inline: true },
        { name: "Rank", value: rank, inline: true },
        {
          name: "Database Authorization",
          value: databaseAuthorization ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Rank Changes Access",
          value: rankChangesAccess ? "Yes" : "No",
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({ text: "Sanguine" });

    // Send the embed
    await interaction.editReply({ embeds: [embed] });
    logAction(
      interaction,
      interaction.user.id,
      "botinfo",
      "User information retrieved",
      "User Data: " +
        JSON.stringify({
          Username: username,
          Rank: rank,
          DatabaseAuthorization: databaseAuthorization,
        })
    ); // Log the action
  },
};
