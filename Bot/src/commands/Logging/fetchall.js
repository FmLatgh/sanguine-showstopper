const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const {
  checkWhitelist,
  handleNotWhitelisted,
  checkDatabaseAccess,
  handleDatabaseAccess,
} = require("../../checkwhitelist.js");
const { logAction } = require("../../loguseage.js");
const noblox = require("noblox.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fetchall")
    .setDescription("Fetch all Roblox accounts based on users with a specific role.")
    .addRoleOption(option =>
      option.setName("role")
        .setDescription("The role to fetch accounts from.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (!checkWhitelist(userId)) {
      handleNotWhitelisted(interaction);
      logAction(interaction, userId, "fetchall", "User not whitelisted", "❌ Failed");
      return;
    }

    if (!checkDatabaseAccess(userId)) {
      handleDatabaseAccess(interaction);
      logAction(interaction, userId, "fetchall", "No DB access", "❌ Failed");
      return;
    }

    await interaction.deferReply({ ephemeral: false });

    const role = interaction.options.getRole("role");
    const guild = interaction.guild;

    if (!guild) {
      await interaction.editReply("❌ Error: Cannot access guild. Make sure bot has the necessary intents.");
      return;
    }

    let members;
    try {
      members = await guild.members.fetch();
    } catch (err) {
      console.error("Error fetching members:", err);
      await interaction.editReply("❌ Failed to fetch members. Make sure the bot has the **GUILD_MEMBERS** intent enabled.");
      return;
    }

    const roleMembers = members.filter(member => member.roles.cache.has(role.id));
    const filePath = path.join(__dirname, "../../../src/userdata.json");

    let userData = [];
    try {
      const fileData = fs.readFileSync(filePath, "utf8");
      userData = JSON.parse(fileData);
      if (!Array.isArray(userData)) userData = [];
    } catch {
      userData = [];
    }

    const mainGroupId = process.env.MAINGROUP_ID ? Number(process.env.MAINGROUP_ID) : null;
    const sanguineGroupId = process.env.SANGUINE_ID ? Number(process.env.SANGUINE_ID) : null;

    let added = 0, already = 0, failed = 0;

    for (const member of roleMembers.values()) {
      const rawName = member.displayName.trim();

      if (!rawName || rawName.length < 3) {
        failed++;
        continue;
      }

      const exists = userData.find(u => u.username.toLowerCase() === rawName.toLowerCase());
      if (exists) {
        already++;
        continue;
      }

      try {
        const userId = await noblox.getIdFromUsername(rawName);
        const player = await noblox.getUserInfo(userId);
        const groups = await noblox.getGroups(userId);

        const mainGroup = groups.find(g => g.Id === mainGroupId);
        const sanguineGroup = groups.find(g => g.Id === sanguineGroupId);

        let groupStatus = "None";
        if (sanguineGroup && mainGroup) groupStatus = "Sanguine and Sanguophage";
        else if (sanguineGroup) groupStatus = "Sanguine";
        else if (mainGroup) groupStatus = "Sanguophage";

        userData.push({
          username: player.name,
          displayName: player.displayName,
          mainGroup: mainGroup ? { name: mainGroup.Name, role: mainGroup.Role } : null,
          sanguineGroup: sanguineGroup ? { name: sanguineGroup.Name, role: sanguineGroup.Role } : null,
          groupStatus,
          rank: "Member",
          attendedEvents: 0
        });

        added++;
      } catch (err) {
        console.warn(`❌ Failed for "${rawName}": ${err.message}`);
        failed++;
      }

      await new Promise(res => setTimeout(res, 500)); // cooldown for rate limit
    }

    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

    const embed = new EmbedBuilder()
      .setColor("#00b0f4")
      .setTitle("Fetch Summary")
      .addFields(
        { name: "✅ Added", value: `${added}`, inline: true },
        { name: "♻️ Already in DB", value: `${already}`, inline: true },
        { name: "❌ Failed", value: `${failed}`, inline: true }
      )
      .setFooter({ text: "Sanguine People" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    logAction(
      interaction,
      userId,
      "fetchall",
      `Added: ${added}, Existing: ${already}, Failed: ${failed}`,
      "✅ Success"
    );
  }
};
