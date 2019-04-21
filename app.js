require('dotenv').config()

const request = require('request-promise');
const Discord = require('discord.js');
const client = new Discord.Client();

// BOT CODES

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

request(`https://jp1.api.riotgames.com/lol/summoner/v4/summoners/by-name/HORTA?api_key=${process.env.RIOT_APIKEY}`)
.then(data => getLiveMatch(JSON.parse(data).id))
.catch(console.error);

async function getLiveMatch (SummonerId) {
  request(`https://jp1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/=${SummonerId}?api_key=${process.env.RIOT_APIKEY}`)
  // .then(data => getLiveMatchData(JSON.parse(data).gameId))
  .then(data => console.log(JSON.parse(data)))
  .catch(console.error);
}


client.on('message', async message => {

});

client.login(process.env.BOT_TOKEN);
