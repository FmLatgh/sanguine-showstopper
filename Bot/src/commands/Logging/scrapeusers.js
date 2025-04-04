const { SlashCommandBuilder } = require("@discordjs/builders");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const readline = require("readline");
const { OAuth2Client } = require("google-auth-library");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scrapeusers")
    .setDescription("Scrape users from a Google Spreadsheet.")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("The link to the Google Spreadsheet.")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply(); // Defer the reply first!

    const link = interaction.options.getString("link");
    const sheetId = link.split("/d/")[1].split("/")[0];
    const ranges = ["D59:E136", "L77:M136", "T72:U136"];

    const credentials = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../../src/credentials.json"))
    );

    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const oAuth2Client = new OAuth2Client(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if token is stored already
    const tokenPath = path.join(__dirname, "token.json");
    fs.readFile(tokenPath, (err, token) => {
      if (err) return getNewToken(oAuth2Client);

      // If we have a token, set it
      oAuth2Client.setCredentials(JSON.parse(token));
      fetchData(oAuth2Client); // Fetch data after successful authentication
    });

    function getNewToken(oAuth2Client) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      });
      console.log("Authorize this app by visiting this url:", authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.log("Error retrieving access token", err);
          oAuth2Client.setCredentials(token);
          fs.writeFileSync(tokenPath, JSON.stringify(token)); // Store the token for future use
          fetchData(oAuth2Client); // Fetch data after successful authentication
        });
      });
    }

    // Fetch data from the sheet
    async function fetchData(oAuth2Client) {
      const sheets = google.sheets({ version: "v4", auth: oAuth2Client });

      try {
        const requests = ranges.map((range) =>
          sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: range,
          })
        );
        const responses = await Promise.all(requests);
        const data = responses.map((response) => response.data.values || []);
        const formattedData = data
          .map((sheet) => sheet.map((row) => row.join(" ")).join("\n"))
          .join("\n\n");

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Scraped Users")
          .setDescription(formattedData || "No data found.")
          .setTimestamp()
          .setFooter({ text: "Sanguine People" });

        await interaction.editReply({ content: "Here's the scraped data:" });
        await interaction.followUp({ embeds: [embed] });
      } catch (error) {
        console.error("Error scraping users:", error);
        await interaction.editReply({
          content:
            "❌ Failed to scrape users. Please check the link and try again.",
        });
      }
    }
  },
};
