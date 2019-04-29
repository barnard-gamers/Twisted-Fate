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

  if (fullContents[0] ===".help") {
    const embedMessage = new Discord.RichEmbed();

    embedMessage.setAuthor("Hi! I'm Twisted Fate!", "http://raw.communitydragon.org/latest/game/assets/characters/twistedfate/hud/twistedfate_circle_11.png")
                .setColor(0x575fcf)
                .setTitle("USAGE:")
                .addField("Get summoner's 3 main champions and those datas", "`.get [Summoner name]`")
                .addField("Get summoner's main champions more/less than 3 times", "`.get -n [Summoner name] [count]`");

    message.channel.send(embedMessage);
  }

  if (fullContents[0] === ".get" && fullContents.join(" ").match(" -n")) {
    fullContents.splice(0, 2);
    const count = parseInt(fullContents[fullContents.length - 1], 10);

    if (isNaN(count)) {
      message.channel.send("You have to set a number attribute at the bottom of your request!");
      return;
    } else if (count > 8) {
      message.channel.send("Sorry, The number must be lower than 9!");
      return;
    }

    fullContents.pop();
    const encodedSummonerName = encoding.urlEncode(fullContents.join(" "));
    analyzeMatchData(encodedSummonerName, count, fullContents.join(" "));
  } else if (fullContents[0] === ".get" && fullContents[1]) {
    fullContents.shift();
    const encodedSummonerName = encoding.urlEncode(fullContents.join(" "));
    analyzeMatchData(encodedSummonerName, 3, fullContents.join(" "));
  }

  async function analyzeMatchData (summonerName, count, plainSN) {
    request(`https://jp1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${riotKey}`)
    .then(data => {return request(`https://jp1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${JSON.parse(data).id}?api_key=${riotKey}`)})
    .then(data => parseSummonerMasterys(JSON.parse(data), count))
    .then(data => createRichEmbed(data, plainSN))
    .then(data => data ? message.channel.send(data) : null)
    .catch(err => err.statusCode === 404 ? message.channel.send("We coudn't find summoner with that name in JP server.") : console.error(err));
  }

  async function parseSummonerMasterys (masteryData, count) {
    const topUsedChampions = {};

    if(count > masteryData.length) {
      message.channel.send("That player doesn't have enough data to analyze...");
      return;
    }

    for (let i = 0; i < count; i ++) {

      const champion = JSON.parse(await request(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/${masteryData[i].championId}.json`)).name;
      topUsedChampions[champion] = masteryData[i];

      if (i === (count - 1)) {
        return topUsedChampions;
      }
    }
  }

  async function createRichEmbed (data, plainSN) {

    if (data == undefined) {
      return;
    }

    const keys = Object.keys(data);

    const embedMessage = new Discord.RichEmbed()
          .setAuthor(`${plainSN}'s main champion is ${keys[0]}!`, `http://opgg-static.akamaized.net/images/lol/champion/${keys[0]}.png`)
          .setTitle(`Champion ranking is below:`)
          .setColor(0x4bcffa);

    await keys.forEach(key => {
      let content = {
        "Mastery level" : data[key].championLevel,
        "Mastery points": data[key].championPoints,
        "Tokens owned"  : data[key].tokensEarned,
        "OP.GG"     : `[${key}](https://jp.op.gg/champion/${encoding.urlEncode(key)})`
      };

      content["Mastery level"] = `mastery${content["Mastery level"]}`

      content = JSON.stringify(content)
                .slice(1, JSON.stringify(content).length - 1)
                .replace(/,/gi, "\n")
                .replace(/"/gi, " ")
                .replace(/:/gi, ": ")
                .replace(/https: /g, "https:")
                .replace(/mastery1/i, message.guild.emojis.find(emoji => emoji.name === "mastery1"))
                .replace(/mastery2/i, message.guild.emojis.find(emoji => emoji.name === "mastery2"))
                .replace(/mastery3/i, message.guild.emojis.find(emoji => emoji.name === "mastery3"))
                .replace(/mastery4/i, message.guild.emojis.find(emoji => emoji.name === "mastery4"))
                .replace(/mastery5/i, message.guild.emojis.find(emoji => emoji.name === "mastery5"))
                .replace(/mastery6/i, message.guild.emojis.find(emoji => emoji.name === "mastery6"))
                .replace(/mastery7/i, message.guild.emojis.find(emoji => emoji.name === "mastery7"));

      content += "\n";

      embedMessage.addField(key, content, false);
    }, );

    return embedMessage;
  }
});

client.login(process.env.BOT_TOKEN);
client.on('error', console.error);
