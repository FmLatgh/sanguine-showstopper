require("dotenv").config();
const {
  Client,
  IntentsBitField,
  Collection,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
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

// Login
client.login(process.env.TOKEN).catch(console.error);
