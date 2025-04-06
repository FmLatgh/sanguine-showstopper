const { SlashCommandBuilder } = require("@discordjs/builders");
const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");
const {
  checkWhitelist,
  handleNotWhitelisted,
  checkDatabaseAccess,
  handleDatabaseAccess,
} = require("../../checkwhitelist.js");
const { logAction } = require("../../loguseage.js");
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("groupwipe")
    .setDescription(
      "Checks all users in the Sanguine group for blacklisted groups."
    )
    .addBooleanOption((option) =>
      option
        .setName("includencoplus")
        .setDescription("Include Stagemaster+ members in the check.")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check if the user is in the whitelist using checkwhitelist.js
    const wl = checkWhitelist(interaction.user.id);
    if (!wl) {
      handleNotWhitelisted(interaction);
      logAction(
        interaction.user.id,
        interaction.commandName,
        "Not whitelisted",
        interaction.guildId
      );
      return;
    }
    if (wl) {
      const dbAccess = checkDatabaseAccess(interaction.user.id);
      if (!dbAccess) {
        handleDatabaseAccess(interaction);
        return;
      }
    }
    const includeNCOplus = interaction.options.getBoolean("includencoplus");
    await interaction.deferReply({ ephemeral: false });

    const blacklistedGroups = [
      34827610, // Crescent
      34827625, // Kyuketsuki
      34827596, // Rosa
      34827603, // Blessed
      35307220, // Profaned
      35612220, // Divine Order
    ];

    const sanguineGroupId = process.env.SANGUINE_ID
      ? Number(process.env.SANGUINE_ID)
      : null;

    if (!sanguineGroupId) {
      logAction(
        interaction.user.id,
        interaction.commandName,
        "Sanguine group ID not configured",
        interaction.guildId
      );
      return interaction.editReply("Sanguine group ID is not configured.");
    }

    let usersWithBlacklist = [];

    try {
      const roles = await noblox.getRoles(sanguineGroupId);

      for (const role of roles) {
        if (!includeNCOplus && role.rank >= 200) continue;

        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const pageData = await noblox.getPlayers(
            sanguineGroupId,
            role.id,
            currentPage
          );
          if (!pageData || pageData.length === 0) break;

          for (const user of pageData) {
            await wait(500); // basic rate limiting

            const userGroups = await noblox.getGroups(user.userId);
            const blacklistedMemberships = userGroups.filter((g) =>
              blacklistedGroups.includes(g.Id)
            );

            if (blacklistedMemberships.length > 0) {
              usersWithBlacklist.push({
                username: user.username,
                userId: user.userId,
                groups: blacklistedMemberships.map(
                  (g) => `${g.Name} (${g.Id})`
                ),
              });
            }
          }

          currentPage++;
          hasMore = pageData.length === 100;
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Group Wipe Report")
        .setColor(0xff0000)
        .setDescription(
          usersWithBlacklist.length > 0
            ? `Found **${usersWithBlacklist.length}** user(s) in blacklisted groups.`
            : "No users found in blacklisted groups."
        )
        .setTimestamp();

      if (usersWithBlacklist.length > 0) {
        for (const user of usersWithBlacklist.slice(0, 10)) {
          embed.addFields({
            name: `${user.username} (${user.userId})`,
            value: `Groups: ${user.groups.join(", ")}`,
          });
        }

        if (usersWithBlacklist.length > 10) {
          embed.addFields({
            name: "More...",
            value: `...and ${usersWithBlacklist.length - 10} more user(s).`,
          });
        }
      }

      await interaction.editReply({ embeds: [embed] });
      logAction(
        interaction.user.id,
        interaction.commandName,
        `Checked ${usersWithBlacklist.length} users`,
        interaction.guildId
      );
    } catch (error) {
      console.error(error);
      await interaction.editReply("An error occurred while checking users.");
      logAction(
        interaction.user.id,
        interaction.commandName,
        `Error: ${error.message}`,
        interaction.guildId
      );
    }
  },
};
