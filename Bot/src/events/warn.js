module.exports = {
    name: "warn",
    async execute(client, warning) {
        const channel = client.channels.cache.find(
            (channel) => channel.name === "output"
        );

        if (channel) {
            channel.send(`knight to d6\n \`${warning}\``);
        }
    },
}