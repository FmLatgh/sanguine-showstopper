const { Client, Shard, ActivityType } = require("discord.js");

module.exports = {
  name: "messageCreate",
  execute(message) {
    // Ignore messages from bots
    if (message.author.bot) return;
    // console.log(message);
    //Returns the my tasklist
    if (message.content.toLowerCase().includes("wat moet ik nog doen")) {
      if (message.author.id == "489812483662544906") {
        message.reply(
          "https://docs.google.com/document/d/1wlKvOdxlTdWyFFWqtSO9KLWXnWprCL89gvenhkagMsk/edit?usp=sharing"
        );
      } else {
        message.reply("Nosy joe.");
      }
    }

    if (message.content == "!shutdown") {
      console.log("tried running sd with " + message.author.id);
      if (message.author.id != process.env.BOT_AUTHOR) {
        message.reply("can't let you");
        return;
      }
      message.reply(
        "= SELF DESTRUCT"
      );

        //find the channel with the name "bot-status"
      const channel = message.client.channels.cache.find(
        (channel) => channel.name === "bot-status"
      );

      //send a message to the channel
      if (channel) {
        channel.send(`🔴 ` + `\`` + new Date() + `\``);
      } else {
        console.log("Channel not found!");
      }
      
      message.client.destroy();
    }
  },
};
