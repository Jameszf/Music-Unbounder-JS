
const { Client, Intents } = require("discord.js");


const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once("ready", () => {
    console.log("Ready!");
});

client.login("ODUzMDE3Mzk4MTYzOTMxMTQ2.YMPQXA.4w7jFGOsfHT-dZ4FrtF9FOz46Wo");

