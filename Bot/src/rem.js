function removeDuplicateSlashCommands(commands) {
  const uniqueCommands = [];
  const seen = new Set();

  for (const command of commands) {
    if (!seen.has(command.name)) {
      uniqueCommands.push(command);
      seen.add(command.name);
    }
  }

  return uniqueCommands;
}

// Example usage with Discord.js:
async function updateCommands(client) {
  try {
    const fetchedCommands = await client.application.commands.fetch(); // Fetch all commands
    const commandsArray = [...fetchedCommands.values()];
    const filteredCommands = removeDuplicateSlashCommands(commandsArray);

    if (commandsArray.length !== filteredCommands.length) {
      console.log("Duplicate commands found. Updating commands...");
      await client.application.commands.set(filteredCommands);
      console.log("Duplicate commands removed and updated successfully.");
    } else {
      console.log("No duplicate commands found.");
    }
  } catch (error) {
    console.error("Error updating commands:", error);
  }
}

// To use this function, call `updateCommands(client)` after the client is ready:
// client.once('ready', () => updateCommands(client));
