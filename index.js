const tmi = require('tmi.js');
const express = require('express');
const https = require('https');
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

app.get('/stats', (req, res) => {
    let follower = "Aucun";
    const url = `https://twitchapi.aidenwallis.co/twitch/latest_follower?channel=${TWITCH_CHANNEL}`;
    const options = { headers: { 'User-Agent': 'Mozilla/5.0' } };

    https.get(url, options, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => body += chunk);
        apiRes.on('end', () => {
            if (apiRes.statusCode === 200 && body.trim().length > 0 && !body.includes("Not Found")) {
                follower = body.trim();
            }
            res.json({ 
                follower: follower, 
                sub: latestSubscriber, 
                cheer: latestCheerer 
            });
        });
    }).on('error', () => {
        res.json({ follower, sub, cheer });
    });
});

app.get('/', (req, res) => { res.send("Proxy_OK"); });

app.listen(PORT, () => console.log(`server_ok port :  ${PORT}`));
