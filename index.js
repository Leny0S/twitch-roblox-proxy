const tmi = require('tmi.js');
const express = require('express');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => console.error('Erreur globale :', err));
process.on('unhandledRejection', (reason) => console.error('Rejection globale :', reason));

const TWITCH_CHANNEL = "lenyos_"; 

let messageQueue = [];
let latestSubscriber = "En attente...";
let latestCheerer = "En attente...";

const client = new tmi.Client({ 
    connection: { reconnect: true, secure: true },
    channels: [ TWITCH_CHANNEL ] 
});

client.connect().catch(err => console.error("Erreur tmi connect :", err));
client.on('error', (err) => console.error("Erreur tmi client :", err));

client.on('message', (channel, tags, message) => {
    try {
        const userColor = tags['color'] || '#FFFFFF'; 
        messageQueue.push({ user: tags['display-name'] || tags['username'], text: message, color: userColor });
        if (messageQueue.length > 25) messageQueue.shift();
    } catch (e) {}
});

client.on("subscription", (channel, username) => { latestSubscriber = username; });
client.on("resub", (channel, username) => { latestSubscriber = username; });
client.on("cheer", (channel, userstate) => { latestCheerer = userstate['display-name'] || userstate['username']; });

app.get('/messages', (req, res) => { 
    res.json(messageQueue); 
});

app.get('/stats', (req, res) => {
    let follower = "Aucun";
    const url = `https://twitchapi.aidenwallis.co/twitch/latest_follower?channel=${TWITCH_CHANNEL}`;
    
    const reqApi = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => body += chunk);
        apiRes.on('end', () => {
            if (apiRes.statusCode === 200 && body.trim().length > 0 && !body.includes("Not Found")) {
                follower = body.trim();
            }
            res.json({ follower, sub: latestSubscriber, cheer: latestCheerer });
        });
    });

    reqApi.on('error', () => {
        res.json({ follower, sub: latestSubscriber, cheer: latestCheerer });
    });
    
    reqApi.end();
});

app.get('/', (req, res) => { res.send("Proxy_OK"); });

app.listen(PORT, () => console.log(`server_ok port : ${PORT}`));
