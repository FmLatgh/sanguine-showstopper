const noblox = require("noblox.js");
const { EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkuser")
    .setDescription("Run some background checks.")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The username of the user to check.")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });
    const username = interaction.options.getString("username");

    const blacklistedGroups = [
      34827610, // Crescent
      34827625, // Kyuketsuki
      34827596, // Rosa
      34827603, // Blessed
      35307220, // Profaned
      35612220, // Divine Order
    ];

    try {
      await interaction.editReply({
        content: "Alright... let's see shall we?",
      });

      const userId = await noblox.getIdFromUsername(username).catch((err) => {
        throw new Error(`Could not find user ID for username "${username}".`);
      });

      if (!userId) {
        return await interaction.editReply({
          content: `❌ Error: Could not find user ID for username "${username}".`,
        });
      }

      const userInfo = await noblox.getPlayerInfo(userId);
      const userGroups = await noblox.getGroups(userId);

      const mainGroupId = process.env.MAINGROUP_ID
        ? Number(process.env.MAINGROUP_ID)
        : null;
      const sanguineGroupId = process.env.SANGUINE_ID
        ? Number(process.env.SANGUINE_ID)
        : null;

      const blacklistedMemberships = userGroups.filter((group) =>
        blacklistedGroups.includes(group.Id)
      );

      const isBlacklisted = blacklistedMemberships.length > 0;

      const mainGroup = userGroups.find((g) => g.Id === mainGroupId);
      const sanguineGroup = userGroups.find((g) => g.Id === sanguineGroupId);

      // Format blacklist info
      const blacklistDetails =
        blacklistedMemberships.length > 0
          ? blacklistedMemberships
              .map((g) => `🔴 ${g.Name} — Rank: ${g.Role}`)
              .join("\n")
          : "✅ None";

      const embed = new EmbedBuilder()
        .setColor(isBlacklisted ? "Red" : "Green")
        .setTitle(`User Check: ${userInfo.username}`)
        .setDescription(
          `[🔗 View Roblox Profile](https://www.roblox.com/users/${userId}/profile)`
        )
        .addFields(
          { name: "Display Name", value: userInfo.displayName, inline: true },
          { name: "Username", value: userInfo.username, inline: true },
          {
            name: "Blacklisted Groups",
            value: blacklistDetails,
            inline: false,
          },
          {
            name: "Main Group",
            value: mainGroup
              ? `✅ ${mainGroup.Name} — Rank: ${mainGroup.Role}`
              : "❌ Not in group",
            inline: false,
          },
          {
            name: "Sanguine Group",
            value: sanguineGroup
              ? `✅ ${sanguineGroup.Name} — Rank: ${sanguineGroup.Role}`
              : "❌ Not in group",
            inline: false,
          }
        )
        .setFooter({
          text: `Inspection carried out by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error(error);
      if (!interaction.replied) {
        await interaction.editReply({
          content: "❌ Error: Could not fetch user info.",
        });
      }
    }
  },
};
