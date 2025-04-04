require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Collect commands from the "commands" folder
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));
    if (command.data?.toJSON) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`Invalid command file: ${file}`);
    }
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    // Register guild-specific commands
    console.log("Refreshing application (/) commands for the guild...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Successfully reloaded guild-specific commands.");
    // When registering commands
    rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("Successfully registered application commands.");
    // Remove outdated global commands
    console.log("Checking for outdated global commands...");
    const existingGlobalCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID)
    );

    const existingGlobalCommandNames = new Set(
      existingGlobalCommands.map((cmd) => cmd.name)
    );

    const commandsToRemove = existingGlobalCommands.filter(
      (cmd) => !commands.some((localCmd) => localCmd.name === cmd.name)
    );

    if (commandsToRemove.length > 0) {
      console.log(
        `Removing ${commandsToRemove.length} outdated global commands...`
      );
      await Promise.all(
        commandsToRemove.map((cmd) =>
          rest.delete(
            `${Routes.applicationCommands(process.env.CLIENT_ID)}/${cmd.id}`
          )
        )
      );
      console.log("Successfully removed outdated global commands.");
    } else {
      console.log("No outdated global commands found.");
    }

    console.log("Command synchronization complete.");
  } catch (error) {
    console.error("Error refreshing application commands:", error);
  }
})();

rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
console.log("Successfully registered context menu.");

// Handle unhandled rejections and uncaught exceptions
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
