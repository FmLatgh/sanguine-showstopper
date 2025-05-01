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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Handle things related to the whitelist.")
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("The action to perform.")
        .setRequired(true)
        .addChoices(
          { name: "Add", value: "add" },
          { name: "Remove", value: "remove" },
          { name: "View", value: "view" }
        )
    ),

  async execute(interaction) {
    const wl = checkWhitelist(interaction.user.id);
    const db = checkDatabaseAccess(interaction.user.id);
    if (!wl) {
      handleNotWhitelisted(interaction);
      logAction(
        interaction,
        interaction.user.id,
        "whitelist",
        "User not whitelisted",
        "Failed"
      );
      return;
    }
    if (!db) {
      handleDatabaseAccess(interaction);
      logAction(
        interaction,
        interaction.user.id,
        "whitelist",
        "User not authorized for database access",
        "Failed"
      );
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const filePath = path.join(__dirname, "../../../src/whitelist.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);

    const action = interaction.options.getString("action");

    if (action === "view") {
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("Whitelist")
        .setDescription("Here are the whitelisted users:")
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          {
            name: "User ID",
            value: Object.keys(data).join(", ") || "None",
            inline: true,
          },
          {
            name: "Username",
            value:
              Object.values(data)
                .map((user) => user.name)
                .join(", ") || "None",
            inline: true,
          },
          {
            name: "Database Authorization",
            value:
              Object.values(data)
                .map((user) => user.DatabaseAuthorization)
                .join(", ") || "None",
            inline: true,
          },
          {
            name: "Rank Changes Authorization",
            value:
              Object.values(data)
                .map((user) => user.RankChangesAuthorization)
                .join(", ") || "None",
            inline: true,
          }
        );
      await interaction.editReply({ embeds: [embed] });
    } else if (action === "add") {
      await interaction.editReply({
        content: "Check your DMs for the setup wizard.",
        ephemeral: true,
      });

      const dmChannel = await interaction.user.createDM();
      const filter = (m) => m.author.id === interaction.user.id;
      const userId = interaction.user.id;
      const username = interaction.user.username;

      try {
        await dmChannel.send(
          "Do you want to authorize **database access**? (yes/no)"
        );
        const dbAuth =
          (
            await dmChannel.awaitMessages({
              filter,
              max: 1,
              time: 30000,
              errors: ["time"],
            })
          )
            .first()
            .content.toLowerCase() === "yes";

        await dmChannel.send(
          "Do you want to authorize **rank changes access**? (yes/no)"
        );
        const rankAuth =
          (
            await dmChannel.awaitMessages({
              filter,
              max: 1,
              time: 30000,
              errors: ["time"],
            })
          )
            .first()
            .content.toLowerCase() === "yes";

        data[userId] = {
          name: username,
          DatabaseAuthorization: dbAuth,
          RankChangesAuthorization: rankAuth,
        };

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

        await dmChannel.send("✅ User successfully added to the whitelist.");
        logAction(
          interaction,
          interaction.user.id,
          "whitelist",
          "Added user to whitelist",
          "Success"
        );
      } catch (err) {
        console.error(err);
        await dmChannel.send(
          "⛔ Timed out or error occurred. Please try again."
        );
        logAction(
          interaction,
          interaction.user.id,
          "whitelist",
          "Failed to add user to whitelist",
          "Failed"
        );
      }
    } else if (action === "remove") {
      const dmChannel = await interaction.user.createDM();
      await interaction.editReply({
        content: "Check your DMs to remove a user.",
        ephemeral: true,
      });

      try {
        await dmChannel.send(
          "Please provide the **User ID** to remove from the whitelist:"
        );
        const collected = await dmChannel.awaitMessages({
          filter: (m) => m.author.id === interaction.user.id,
          max: 1,
          time: 30000,
          errors: ["time"],
        });
        const targetId = collected.first().content;

        if (!data[targetId]) {
          await dmChannel.send("⛔ No such user found in the whitelist.");
          return;
        }

        delete data[targetId];
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

        await dmChannel.send(
          "✅ User successfully removed from the whitelist."
        );
        logAction(
          interaction,
          interaction.user.id,
          "whitelist",
          `Removed user ${targetId}`,
          "Success"
        );
      } catch (err) {
        console.error(err);
        await dmChannel.send(
          "⛔ Timed out or error occurred. Please try again."
        );
        logAction(
          interaction,
          interaction.user.id,
          "whitelist",
          "Failed to remove user",
          "Failed"
        );
      }
    }
  },
};
