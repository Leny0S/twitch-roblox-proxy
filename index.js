const tmi = require('tmi.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let messageQueue = [];
const TWITCH_CHANNEL = "lenyos_"; 

const client = new tmi.Client({ channels: [ TWITCH_CHANNEL ] });
client.connect().catch(err => console.error(err));

client.on('message', (channel, tags, message) => {
    messageQueue.push({ user: tags['display-name'], text: message });
    if (messageQueue.length > 25) messageQueue.shift();
});

app.get('/messages', (req, res) => { res.json(messageQueue); });
app.get('/', (req, res) => { res.send("Proxy_OK"); });

app.listen(PORT, () => console.log(`server_ok port :  ${PORT}`));
