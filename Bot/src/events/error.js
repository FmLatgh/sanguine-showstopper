module.exports = {
    name: "error",
    async execute(client, error) {
        if (!client.channels || !client.channels.cache) {
            console.error("Client channels are not accessible. Check your intents.");
            return;
        }

        const channel = client.channels.cache.find(
            (channel) => channel.name === "output"
        );

        if (channel) {
            channel.send(`PATRON I BROKE HELP ME\n \`${error}\``);
        } else {
            console.error("Output channel not found.");
        }
    },
};