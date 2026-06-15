const tmi = require('tmi.js');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const SE_ACCOUNT_ID = "646a48fe2c8b5bc99339b5bb"; 
const TWITCH_CHANNEL = "lenyos_"; 

let messageQueue = [];
const client = new tmi.Client({ channels: [ TWITCH_CHANNEL ] });
client.connect().catch(err => console.error(err));

client.on('message', (channel, tags, message) => {
    const userColor = tags['color'] || '#FFFFFF'; 
    messageQueue.push({ user: tags['display-name'], text: message, color: userColor });
    if (messageQueue.length > 25) messageQueue.shift();
});

app.get('/messages', (req, res) => { res.json(messageQueue); });

app.get('/stats', async (req, res) => {
    try {
        const response = await fetch(`https://api.streamelements.com/v2/activities/${SE_ACCOUNT_ID}?limit=20`, {
            headers: {
                'Authorization': `Bearer ${process.env.SE_TOKEN}`
            }
        });
        if (!response.ok) throw new Error("API_Error");
        const data = await response.json();
        
        let follower = "Aucun";
        let sub = "Aucun";
        let cheer = "Aucun";
        
        if (Array.isArray(data)) {
            for (let activity of data) {
                if (activity.type === 'follow' && follower === "Aucun") follower = activity.username || "Aucun";
                if (activity.type === 'subscriber' && sub === "Aucun") sub = activity.username || "Aucun";
                if (activity.type === 'cheer' && cheer === "Aucun") cheer = activity.username || "Aucun";
            }
        }
        
        res.json({ follower, sub, cheer });
    } catch (err) {
        res.json({ follower: "Aucun", sub: "Aucun", cheer: "Aucun" });
    }
});

app.get('/', (req, res) => { res.send("Proxy_OK"); });

app.listen(PORT, () => console.log(`server_ok port :  ${PORT}`));
