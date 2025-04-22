const { Events } = require("discord.js");
const noblox = require("noblox.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log("🎣 Setting up join request listener...");

    const groupId = Number(process.env.SANGUINE_ID);
    if (!groupId) {
      return console.error(
        "❌ SANGUINE_ID not defined in environment variables."
      );
    }

    noblox.onJoinRequest(groupId, async (request) => {
      try {
        const userInfo = await noblox.getUserInfo(request.requester.userId);
        const accountCreated = new Date(userInfo.created);
        const now = new Date();
        const ageInDays = Math.floor(
          (now - accountCreated) / (1000 * 60 * 60 * 24)
        );

        if (ageInDays < 7) {
          const owner = await client.users.fetch(process.env.BOT_AUTHOR);

          if (owner) {
            await owner.send({
              content: `⚠️ Suspicious Join Request Detected in Group ID: ${groupId}`,
              embeds: [
                {
                  title: "New Join Request",
                  color: 0xffcc00,
                  fields: [
                    {
                      name: "Username",
                      value: `${userInfo.username} (${userInfo.userId})`,
                      inline: true,
                    },
                    {
                      name: "Account Age",
                      value: `${ageInDays} days`,
                      inline: true,
                    },
                    {
                      name: "Account Created",
                      value: accountCreated.toDateString(),
                      inline: false,
                    },
                    { name: "Group ID", value: `${groupId}`, inline: false },
                  ],
                  footer: { text: "Join Request Monitor" },
                  timestamp: new Date().toISOString(),
                },
              ],
            });
          } else {
            console.warn("❗ BOT_AUTHOR user not found or can't be DMed.");
          }
        }
      } catch (err) {
        console.error("💥 Failed to process suspicious join request:", err);
      }
    });
  },
};
