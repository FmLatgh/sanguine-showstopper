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

    //meme
    if (message.content === "This is the police speaking...") {
      message.reply("**This club is closed...** ***FOREVER!***");
    }

    //info (informal)
    if (
      message.content.toLowerCase().includes("what's san tompocnia actually")
    ) {
      message.reply(
        "Horror. \n\nhttps://tenor.com/view/cavern-crusher-san-tompocnia-savato-roblox-cc-astenian-gif-3929852365934438667"
      );
    }

    //funny meme
    if (message.content === "must be great being you") {
      message.reply(
        "power comes as second nature.... must feel amazing to be longed for, longed for.."
      );
    }

    if (message.content === "<@1343937229902450718>") {
      //make an embed containing the following text:
      const embed = {
        color: 0x0099ff,
        title: "That's me!",
        description:
          'San Tompocnia is a project built by "Stan", better known as <@489812483662544906> and overseen by "Ricardo", better known as <@386122940627812362>. During this 10 week project, I\'m developed as a little devil that does all of the dirty laundry.',
        fields: [
          {
            name: "What exactly do I do?",
            value:
              "Simply put, I'm the swiss knife for Patron. I'm kind of his biggest hater there's out there, but I somehow manage to suprise him with every sitting. \n\nI do everything from making sure the server is running smoothly, to creating and managing the world of San Tompocnia. I also help with the development of the game mechanics and features, ensuring that everything is working as intended.",
          },
          {
            name: "So where did 'San Tompocnia Savato' come from?",
            value:
              "San Tompocnia Savato is an 1/? rarity ore you can find in 'Cavern Crusher'. Upon mining it, it'll jumpscare they player and then playing a GIF afterwards. It's silliness and absurd placement has made it popular.",
          },
          {
            name: "What if I'm broken?",
            value:
              "Oh, don't worry about that. Patron will fix me. He always does. \n\nIf you have any issues with me, please contact him directly. He'll be more than happy to help you out. He's not responsible for your rage though.",
          },
        ],
        timestamp: new Date(),
        footer: {
          text: "Actual Information",
        },
      };
      message.channel.send({ embeds: [embed] });
    }

    if (message.content.toLowerCase().includes("<@1343937229902450718>  what do you do")) {
      //Fetch list of commands from the bot
      console.log("Ran");
      const commands = message.client.application.commands.cache.map(
        (command) => command.name
      );
      //make an embed containing the following text:
      const embed = {
        color: 0x0099ff,
        title: "Commands",
        description: "Here are the commands I can do:",
        fields: [
          {
            name: "Commands",
            value: commands.join(", "),
          },
        ],
        timestamp: new Date(),
        footer: {
          text: "Actual Information",
        },
      };
      message.channel.send({ embeds: [embed] });
    }

    if (message.content.toLowerCase() === "<@1343937229902450718> i hate you") {
      if (message.author.id == "489812483662544906") {
        message.reply(
          "After this amount of working, this is the best you can come up with?"
        );
      } else {
        message.reply("Meanie :( i'm gonna go time you out now....");
        message.member.timeout(
          1 * 60 * 1000,
          "I don't like being called names"
        );
      }
    }

    if (message.content == "!shutdown") {
      console.log("tried running sd with " + message.author.id);
      if (message.author.id != process.env.BOT_AUTHOR) {
        message.reply("can't let you");
        return;
      }
      message.reply(
        "Ok selfdestructing rn (maybe so gateway can fetch commands or something)"
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

    if (message.content.toLowerCase().includes("limbus company")) {
      message.reply(
        "https://www.youtube.com/watch?v=cwP2GD1Iw_E"
      ) 
    }
  },
};
