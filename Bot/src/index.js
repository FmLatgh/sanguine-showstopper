const noblox = require("noblox.js");
require("dotenv").config();
const {
  Client,
  IntentsBitField,
  Collection,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

if (!process.env.TOKEN || !process.env.ROBLOX_COOKIE) {
  console.error("❌ Missing TOKEN or ROBLOX_COOKIE in .env file");
  process.exit(1);
}

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
  partials: ['CHANNEL'], // Needed to receive DMs
});

// Initialize collections
client.commands = new Collection();

// Load handlers
const handlersPath = path.join(__dirname, "handlers");
fs.readdirSync(handlersPath).forEach((file) => {
  require(path.join(handlersPath, file))(client);
});

// Error handling
client.on("error", console.error);
client.on("warn", console.warn);

// Confirm Discord login
client.once("ready", () => {
  console.log(`✅ Logged in to Discord as ${client.user.tag}`);
});

// Roblox login
async function roblox() {
  try {
    const currentUser = await noblox.setCookie(process.env.ROBLOX_COOKIE);
    console.log(`✅ Logged in to Roblox as ${currentUser.name} [${currentUser.id}]`);
  } catch (err) {
    console.error("❌ Failed to log into Roblox:", err);
  }
}
roblox();

// Discord bot login
client.login(process.env.TOKEN).catch((err) => {
  console.error("❌ Failed to log into Discord:", err);
});
