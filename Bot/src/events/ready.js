const { ActivityType, Shard } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`Getting ${client.user.tag} online... hold on.`);
    //set the status of the bot to "Playing Sanguophage" 

    client.user.setActivity("Sanguophage Project", {
      type: ActivityType.Playing,
    });

    const latency = client.ws.ping;
    console.log(`Latency: ${latency}ms`);
    
    //find the channel with the name "status"
    const channel = client.channels.cache.find(
      (channel) => channel.name === "bot-status"
    );

    //send a message to the channel
    if (channel) {
      channel.send(`🟢 ` + `\`` + new Date() + `\``);
    } else {
      console.log("Channel not found!");
    }
  },
};
