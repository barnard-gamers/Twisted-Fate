require('dotenv').config()

const request = require('request-promise');
const Discord = require('discord.js');
const encoding = require('encoding-japanese');
const client = new Discord.Client();
const riotKey = process.env.RIOT_APIKEY;

// BOT CODES

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
  const fullContents = message.content.trim().split(" ");

  if (fullContents[0] === "!get" && fullContents[1]) {
    fullContents.shift();
    const encodedSummonerName = encoding.urlEncode(fullContents.join(" "));
    analyzeMatchData(encodedSummonerName, 3);
  }

  async function analyzeMatchData (summonerName, count) {
    request(`https://jp1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riotKey}`)
    .then(data => {return request(`https://jp1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${JSON.parse(data).id}?api_key=${riotKey}`)})
    .then(data => parseSummonerMasterys(JSON.parse(data), count))
    .then(data => message.channel.send(JSON.stringify(data)));
  }

  async function parseSummonerMasterys (masteryData, count) {
    const topUsedChampions = {};
    for (let i = 0; i < count; i ++) {
      const key = JSON.parse(await request(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/${masteryData[i].championId}.json`)).name;
      const champion = masteryData[i];
      topUsedChampions[key] = champion;
      if (i === (count - 1)) {
        return topUsedChampions;
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);
client.on('error', console.error);
