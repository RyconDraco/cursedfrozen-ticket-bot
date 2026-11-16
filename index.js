const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('❄️ CursedFrozen Support is running!');
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Web server is running!');
});

client.once('ready', () => {
  console.log(`❄️ CursedFrozen Support Online: ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
