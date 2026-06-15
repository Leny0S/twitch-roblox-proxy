const tmi = require('tmi.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => console.error(err));
process.on('unhandledRejection', (reason) => console.error(reason));

const TWITCH_CHANNEL = "lenyos_"; 

let messageQueue = [];

const client = new tmi.Client({ 
    connection: { reconnect: true, secure: true },
    channels: [ TWITCH_CHANNEL ] 
});
client.connect().catch(err => console.error(err));

client.on('message', (channel, tags, message) => {
    try {
        const userColor = tags['color'] || '#FFFFFF'; 
        messageQueue.push({ 
            user: tags['display-name'] || tags['username'], 
            text: message, 
            color: userColor 
        });
        if (messageQueue.length > 25) messageQueue.shift();
    } catch (e) {}
});

app.get('/messages', (req, res) => { 
    res.json(messageQueue); 
});

app.get('/', (req, res) => { 
    res.send("Proxy_OK"); 
});

app.listen(PORT, () => console.log(`server_ok port : ${PORT}`));
