const { ActivityType, Shard } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`Thus begin the life and times of ${client.user.tag}.`);
    client.user.setActivity({
      name: "Cavern Crusher",
      type: ActivityType.Competing,
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
