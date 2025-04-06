const { EmbedBuilder, WebhookClient } = require("discord.js");
require("dotenv").config();

function logAction(possibleInteraction, userID, action, message, result) {
  // Log raw input for debugging
  console.log("🪵 [logAction] Raw input:", {
    possibleInteraction,
    userID,
    action,
    message,
    result,
  });

  const webhookURL = process.env.WEBHOOK_URL;
  if (!webhookURL) {
    console.error("❌ WEBHOOK_URL is not defined in environment variables.");
    return;
  }

  const webhookClient = new WebhookClient({ url: webhookURL });

  // Default values if no interaction is passed
  let userTag = "Unknown";
  let userMention = "Unknown";
  let username = "Unknown";
  let avatarURL = null;
  let guildName = "Unknown";

  // Check if interaction-like object is passed
  if (possibleInteraction && possibleInteraction.user) {
    const user = possibleInteraction.user;
    userTag = user.tag || "Unknown";
    userMention = `<@${user.id}>` || "Unknown";
    username = user.username || "Unknown";
    avatarURL = user.displayAvatarURL?.() || null;
    guildName = possibleInteraction.guild?.name || "Unknown";
  }

  const embed = new EmbedBuilder()
    .setColor(result?.includes("❌") ? "Red" : "#0099ff")
    .setTitle("📋 Action Logged")
    .addFields(
      { name: "👤 User", value: userMention, inline: true },
      { name: "🧑 Username", value: username, inline: true },
      { name: "#️⃣ Tag", value: userTag, inline: true },
      {
        name: "🆔 User ID",
        value: userID?.toString() || "Unknown",
        inline: true,
      },
      { name: "⚙️ Action", value: action || "None", inline: true },
      {
        name: "💬 Message",
        value: message || "No message provided",
        inline: false,
      },
      {
        name: "📊 Result",
        value: result || "No result provided",
        inline: true,
      },
      { name: "🌐 Guild", value: guildName, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "Log Usage", iconURL: avatarURL || undefined });

  webhookClient.send({ embeds: [embed] }).catch((err) => {
    console.error("❌ Failed to send log to webhook:", err);
  });
}

module.exports = { logAction };
