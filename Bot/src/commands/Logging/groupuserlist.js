const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const env = require("dotenv").config();
const noblox = require("noblox.js");

const {
  checkWhitelist,
  handleNotWhitelisted,
  checkDatabaseAccess,
  handleDatabaseAccess,
} = require("../../checkwhitelist.js");

const { logAction } = require("../../loguseage.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("groupuserlist")
    .setDescription("Fetches a list of all users in the Sanguine Roblox group."),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Whitelist check
    if (!checkWhitelist(userId)) {
      handleNotWhitelisted(interaction);
      logAction(interaction, userId, "groupuserlist", "User not whitelisted", "❌ Failed");
      return;
    }

    // DB access check
    if (!checkDatabaseAccess(userId)) {
      handleDatabaseAccess(interaction);
      logAction(interaction, userId, "groupuserlist", "No DB access", "❌ Failed");
      return;
    }

    await interaction.deferReply({ ephemeral: false });

    const groupId = Number(process.env.SANGUINE_ID);
    if (!groupId) {
      await interaction.editReply("❌ Group ID is not set or invalid.");
      return;
    }

    // Initial response
    const progressMsg = await interaction.followUp("📥 Fetching group members, please wait...");

    let groupUsers = [];
    try {
      groupUsers = await getAllGroupMembers(groupId, async (fetched, totalEstimate) => {
        await progressMsg.edit(`📊 Progress: ${fetched} users fetched${totalEstimate ? ` / ~${totalEstimate}` : ""}...`);
      });
    } catch (err) {
      console.error("Error fetching group members:", err);
      await progressMsg.edit("❌ Roblox servers are likely down or unreachable. Please try again later.");
      return;
    }

    if (groupUsers.length === 0) {
      await progressMsg.edit("✅ No users found in the group.");
      return;
    }

    // Create plain text file
    const fileData = groupUsers.map(user => `${user.username} (${user.userId})`).join("\n");
    const filePath = path.join(__dirname, "group_users.txt");
    fs.writeFileSync(filePath, fileData);

    // Send file as attachment
    const attachment = new AttachmentBuilder(filePath);
    await progressMsg.edit({
      content: `✅ Done! Found ${groupUsers.length} users in the group.`,
      files: [attachment],
    });

    logAction(interaction, userId, "groupuserlist", `Fetched ${groupUsers.length} users.`, "✅ Success");
  },
};

// Helper with rate limiting and retries
async function getAllGroupMembers(groupId, onProgress) {
  let allUsers = [];
  let cursor = null;
  let retries = 0;

  while (true) {
    try {
      const page = await noblox.getPlayers(groupId, {
        limit: 500,
        cursor: cursor,
      });

      allUsers.push(...page.data);

      if (onProgress) {
        const totalEstimate = page.totalEntries || null;
        await onProgress(allUsers.length, totalEstimate);
      }

      if (!page.nextPageCursor) break;
      cursor = page.nextPageCursor;
      retries = 0;

      await new Promise((res) => setTimeout(res, 750)); // rate limiting
    } catch (err) {
      if (err.message.includes("500") && retries < 3) {
        retries++;
        console.warn(`⚠️ Retry ${retries}/3 due to 500 error...`);
        await new Promise((res) => setTimeout(res, 2000 * retries)); // exponential backoff
        continue;
      } else {
        throw err;
      }
    }
  }

  return allUsers;
}
