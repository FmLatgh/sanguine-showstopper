module.exports = {
    name: "shardDisconnect",
    execute(event, shardId) {
        // Log the shard ID and the event
        console.log(`Shard ${shardId} disconnected: ${event}`);
    }
}