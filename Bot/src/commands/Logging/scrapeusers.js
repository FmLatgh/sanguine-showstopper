const { SlashCommandBuilder } = require("@discordjs/builders");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const readline = require("readline");
const { OAuth2Client } = require("google-auth-library");
const noblox = require("noblox.js"); // Import Noblox.js for Roblox integration

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
      fs.readFileSync(path.join(__dirname, "../../../src/credentials2.json"))
    );

    const { client_id, client_secret, redirect_uris } = credentials.web;
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
          .map((sheet) => sheet.map((row) => row[0]).filter(Boolean)) // Filter out empty usernames
          .flat();

        // Initialize counters
        let addedCount = 0;
        let notAddedCount = 0;
        let alreadyAddedCount = 0;
        let totalCount = formattedData.length;

        // Read the existing user data from file
        let userData = [];

        // Check if the userdata file exists and is valid
        try {
          const fileData = fs.readFileSync(
            path.join(__dirname, "userdata.json"),
            "utf8"
          );
          userData = JSON.parse(fileData); // Parse JSON content
          if (!Array.isArray(userData)) {
            userData = []; // If not an array, initialize as an empty array
          }
        } catch (error) {
          // If the file doesn't exist or is invalid, initialize as an empty array
          userData = [];
        }

        // Function to add delay between requests to avoid rate limits
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        for (let i = 0; i < formattedData.length; i++) {
          const username = formattedData[i];

          // Ensure username is a non-empty string
          if (!username.trim()) {
            notAddedCount++;
            continue;
          }

          // Check if the username is already in the database
          if (userData.some((user) => user.username === username)) {
            alreadyAddedCount++;
            continue;
          }

          try {
            // Get the user ID from the username first
            const userId = await noblox.getIdFromUsername(username.trim());

            // Now that we have the user ID, fetch user info
            const player = await noblox.getUserInfo(userId);

            // If player is found, add them to the user data
            const newUser = {
              username: player.username,
              displayName: player.displayName,
              groupStatus: "Sanguine and Sanguophage", // You can update this based on your data
              rank: "Member", // Update rank logic
              attendedEvents: 0, // Update based on your needs
            };

            userData.push(newUser);
            addedCount++;

            // Add delay between requests to avoid hitting rate limits
            await delay(500); // Delay for 500ms (adjust as needed)

            // Update progress after every 10th user for better feedback
            if (i % 10 === 0 || i === totalCount - 1) {
              await interaction.editReply({
                content: `Scraping in progress... Scraped ${
                  i + 1
                } out of ${totalCount} users.`,
              });
            }
          } catch (error) {
            // Handle error if user is not found or another issue occurs
            if (error.message.includes("NotFound")) {
              console.log(`User not found: ${username}`);
              notAddedCount++;
            } else {
              console.error(
                `Failed to retrieve data for user: ${username}`,
                error
              );
              notAddedCount++;
            }
          }
        }

        // Write the updated user data back to the JSON file
        fs.writeFileSync(
          path.join(__dirname, "/../../../src/userdata.json"),
          JSON.stringify(userData, null, 2)
        );

        // Create the summary embed
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Scraping Summary")
          .setDescription(
            `**Scraped Users:**\n\n- Added: ${addedCount}\n- Not Added (Invalid Username or No Data): ${notAddedCount}\n- Already Added: ${alreadyAddedCount}`
          )
          .setTimestamp()
          .setFooter({ text: "Sanguine People" });

        // Final update after scraping is complete
        await interaction.editReply({
          content: "Scraping complete! Finalizing...",
        });

        // Send the embed with the summary after scraping finishes
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
