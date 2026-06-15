const tmi = require('tmi.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const TWITCH_CHANNEL = "lenyos_"; 

let messageQueue = [];
let latestSubscriber = "En attente...";
let latestCheerer = "En attente...";

const client = new tmi.Client({ channels: [ TWITCH_CHANNEL ] });
client.connect().catch(err => console.error(err));

client.on('message', (channel, tags, message) => {
    const userColor = tags['color'] || '#FFFFFF'; 
    messageQueue.push({ user: tags['display-name'], text: message, color: userColor });
    if (messageQueue.length > 25) messageQueue.shift();
});

client.on("subscription", (channel, username, method, message, userstate) => {
    latestSubscriber = username;
});

client.on("resub", (channel, username, months, message, userstate, methods) => {
    latestSubscriber = username;
});

client.on("cheer", (channel, userstate, message) => {
    latestCheerer = userstate['display-name'] || userstate['username'];
});

app.get('/messages', (req, res) => { res.json(messageQueue); });

app.get('/stats', async (req, res) => {
    let follower = "Aucun";
    try {
        const response = await fetch(`https://decapi.me/twitch/latest_follower?channel=${TWITCH_CHANNEL}`);
        if (response.ok) {
            follower = await response.text();
        }
    } catch (err) {
        follower = "Erreur";
    }

    res.json({ 
        follower: follower.trim(), 
        sub: latestSubscriber, 
        cheer: latestCheerer 
    });
});

app.get('/', (req, res) => { res.send("Proxy_OK"); });

app.listen(PORT, () => console.log(`server_ok port :  ${PORT}`));
