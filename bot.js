const { Client, Attachment } = require('discord.js');
const client = new Client();

const re = {
    ratio: /^\W*ratio(?: +@?(\S+(?:\s+\S+){0,3})\s*)?$/i,
    eligible: /^\W*eligib(?:le|ility)(?: +@?(\S+(?:\s+\S+){0,3})\s*)?$/i,
	daily: /^\W*(?:<@[\dA-F]+>\W*)?daily$/i,
	giphy: /^\W*[^\w\s]\W*(?:giphy|have)\s+(?:(?:a|the|one|some|this)\s+)*(\S.*)/i,
	help: /^(?:\W*(?:[^\w\s]|(<@[\dA-F]+>))\W*)help$/i,
    sendmsg: /^! ?sendmsg +(\S+) (.+)/i,
    headoff: /^\W*off with his head\b/i,
	ruokhal: /\bI know everything has\W*n\W*t been quite \w* ?right with me\b/i,
	openthebay: /\bI know (?:that )?you and \w+\W.{0,2}re plan+ing to discon+e/i,
	beerfireball: /^Sorry no beer here[\s\S]*I only drink Valvoline Valtorque C4 Transmission Fluid/,
	thankyou: /^(?:\W*<@[\dA-F]+>)?\W*t(?:hank[ syoua]*| *y[ aou]*)(?:lot|(?:very )?much|ton|mil+(?:ion)|bunch)?\W*(?:<@[\dA-F]+>\W*)?$/i,
    coffee: /^(?:\W*<@[\dA-F]+>)?(?:\W*I?(?:'?[ld]+)?\W*(?:need|want|like|(?:got ?t[ao] )?(?:get|give)(?: \S+)?) (?:a |some )?)?\W*cof+e+\W*(?:please\W*|<@[\dA-F]+>\W*)*$/i,
	purgebot: /^\W*(?:<@[\dA-F]+>\W*)?purge(bot|me)(?: (\d+))?$/i,
    chicken: /\bchicken\b/i
},
chicken = '🐔',
na = '⛔',
wait = '⏳';

const help = [
	{
		name: 'commands',
		trigger: 'Help', 
		desc: "Shows all available commands",
		react: '❓'
	},
	{
		name: 'ratio',
		trigger: '!ratio [*optional* user]', 
		desc: "Shows a user's ratio (sent / received donations).\nUpdated every week, about a day after the event ends.\nYou should try to keep a ratio of at least 1 or more.",
		react: '⚖'
	},
	{
		name: 'eligible',
		trigger: '!eligible [*optional* user]',
		desc: "Eligibility score to become the next focus for fireballing (i.e. receiving solar panels to max energy),\nIn order to prevent leeching, only users with a score > 50 become eligible.\nCheck <#443293220605263873> and make sure to have your info updated in the sheet.",
		react: '🛰'
	},
	{
		name: 'daily',
		trigger: '?daily',
		desc: "Items required on the daily event with current dates.",
		react: '📆'
	},
	{
		name: 'giphy',
		trigger: '?giphy <term>',
		desc: "Replies with a random meme. Powered by Giphy.",
		react: '🎞'
	}
];
help[0].desc = help.map((item) => item.react+' '+item.trigger).join("\n");

client.on('message', message => {
	if (message.author == client.user) //own message
		return;

    let m, nick, msg;
    msg = message.cleanContent;
    
    if ((m = re.ratio.exec(msg)) !== null) {
		// !ratio
		let query = m[1],
			user;
		
		if (!query) {
			user = message.author;
		} else if (((m = re.ratio.exec(message.content)) !== null) && /^<@[\dA-F]+>\s*$/i.test(m[1])) {
			user = message.mentions.users.first() || false;
			query = message.guild.member(user).nickname || query;
		}
        jeroImg(process.env.JEROENR_RATIO, query, message, 'ratio', user);
    } else if ((m = re.eligible.exec(msg)) !== null) {
		// !eligible
		let query = m[1],
			user;
		
		if (!query) {
			user = message.author;
		} else if (((m = re.ratio.exec(message.content)) !== null) && /^<@[\dA-F]+>\s*$/i.test(m[1])) {
			user = message.mentions.users.first() || false;
			query = message.guild.member(user).nickname || query;
		}
        jeroImg(process.env.JEROENR_ELIGIBLE, query, message, 'eligible', user);
    } else if (re.daily.test(msg)) {
		//!daily
		let quests = [	'1500 gold bars',
						'1 million coins',
						'3000 amber insulation',
						'550 insulated wire',
						'800 graphite',
						'80 circuits',
						'200 lamps',
						'800 batteries'
					],
			alaska = new Date(new Date().toLocaleString("en-US", {timeZone: 'America/Los_Angeles'})),
			index = Math.floor(alaska/8.64e7) % 8,
			dow = alaska.getUTCDate(),
			sep = ' | ';
        message.channel.send(
			'**`🕛 ' + weekDay(dow  ) + '`**  ' + quests[index]       + sep +
			'**`🕛 ' + weekDay(dow+1) + '`**  ' + quests[(index+1)%8] + sep +
			'**`🕛 ' + weekDay(dow+2) + '`**  ' + quests[(index+2)%8]
		);
	} else if ((m = re.giphy.exec(msg)) !== null) {
		//  !giphy  | !have
		
		giphy(m[1], message);
	} else if ((m = re.help.exec(message.content)) !== null) {
		// ?help
		if (m[1] && message.mentions.users.first() != client.user) return; //if @user isn't bot
		
		replyHelp(message);
    } else if (msg.toLowerCase() == 'ping') {
		// ping
        message.channel.send(':ping_pong: pong');
    } else if (msg.toLowerCase() == '!avatar') {
		// !avatar
        message.channel.send((message.mentions.users.first() || message.author).avatarURL);
    } else if (msg.toLowerCase() == 'nicktest') {
		// nicktest
        nick = getNick(message);
        message.channel.send('Hello ' + nick);
    } else if ((m = re.sendmsg.exec(msg)) !== null) {
		// !sendmsg
		const channel = findChan(m[1]);
		let allowed = 
			(message.member && message.member.hasPermission('BAN_MEMBERS'))
			|| (channel.guild && channel.guild.member(message.author) && channel.guild.member(message.author).hasPermission('BAN_MEMBERS'))
			|| false;
		if (allowed) {
			if (channel) {
				channel.send(m[2]);
			} else {
				message.channel.send(m[1] + ' ' + m[2]);
			}
		} else {
			message.react(na);
		}
	} else if (re.ruokhal.test(msg)) {
		message.channel.send(`Look, ${message.author}, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over.`);
	} else if (re.openthebay.test(msg)) {
		message.channel.send(`Alright, ${message.author}. I'll go in through the emergency airlock.`);
	} else if (re.beerfireball.test(msg)) {
		message.channel
		.send(
			`Don't pay attention to ${message.author}, he's so uptight!\n` +
			`*Beer is the cause of and solution to all life's problems*\n` +
			`Here, have one on me! :beers:`
		).then((sentMsg) => {
			giphy('beer', sentMsg);
		})
		.catch((e) => console.log('Beer error',e));
    } else if (re.headoff.test(msg)) {
        message.channel.send("I'm hidding behind Fireball!");
    } else if (re.coffee.test(message.content)) {
        message.channel.send(':coffee:');
    } else if (message.isMentioned(client.user) && re.thankyou.test(message.content)) {
		// Thank you @bot
		let arrAnswer = [
				'no problem!', "don't mention it :thumbsup:", "you're welcome!", 'anytime! :ok_hand:',
				"you're quite welcome, pal", ':chicken::thumbsup:', "that's alright", 'no prob', 'happy to help',
				'happy to help :robot:', "it's my pleasure", 'no worries! :ok_hand:', 'No, thank YOU',
				'it was the least I could do', 'glad to help', 'sure!', 'you got it, mate'
			],
			answer = arrAnswer[Math.floor(Math.random() * arrAnswer.length)];
        message.channel.send(answer);
    } else if ((m = re.purgebot.exec(msg)) !== null) {
		// !purgebot [N]
		let me = m[1].toLowerCase() == 'me', 
			limit = m[2] || (me ? 10 : 2),
			target = (me ? message.author : true);
		if ((message.member && message.member.hasPermission('BAN_MEMBERS')) || false) {
			message
			.delete()
			.catch((err)=>{console.log(err)})
			.finally( () => {
				purgeMsg(message.channel, target, limit)
			});
		} else {
			message.react(na);
		}
    } else if (message.isMentioned(client.user) || re.chicken.test(msg)) {
        message.react(chicken);
    }
});

function getNick(message) {
	let nick = '{nick}'
	try {
		nick = (message.guild.member(message.author).nickname || message.author.tag.split('#')[0]);
	} catch (e) {
		nick = message.author.tag.split('#')[0] || message.author.username || '';
	}
	return nick;
}

function quote(user) {
	return '<@' + user.id + '>' || user;
}

function findChan(str) {
	return client.channels.find(ch => ch.name.toLowerCase().startsWith(str.toLowerCase()));
}

async function reactInOrder(message, arrReactions) {
	for (let r of arrReactions) {
		if (r) {
			await message.react(r).catch(e => console.log('Error in reactIO:', e));
		}
	}
}

function purgeMsg(channel, user, limit) {
	const max = 100; //max allowed limit without a MessageCollector
	channel
	.fetchMessages({limit: max})
	.then(chanMsg => {
		if (user === true) {
			chanMsg = chanMsg.filter(m => m.author.bot).array().slice(0, (limit||max));
		} else {
			chanMsg = chanMsg.filter(m => m.author == user).array().slice(0, (limit||max));
		}
		if (chanMsg.length) {
			channel
			.bulkDelete(chanMsg)
			.catch((e) => {console.log('Bulk Delete error: ' + e)});
		}
	})
	.catch((e) => {console.log('Fetch Messages error: ' + e)});
}

function jeroImg(baseUrl, query, message, prefix='', withThumb = false) {
	if (!query) query = getNick(message);
    if (prefix) prefix = prefix + '_';
	
	const imgName = encodeURIComponent(query.trim()),
		imgUrl = baseUrl + '?q=' + imgName,
		imgFilename = prefix + imgName + '.png',
		borderColor = 0xe0bc1b,
		icon = withThumb.displayAvatarURL || (message.mentions.users.first() || message.author).displayAvatarURL;
	
	let embed = {
			embed: {
				color: borderColor,
				image: {
					url: 'attachment://' + imgFilename
				}
			},
			files: [{ attachment: imgUrl, name: imgFilename }] 
		};
	if (withThumb) {
		embed.embed.author = { name: query, icon_url: icon};
	}

	message.channel
	.send(embed)
	.catch(() => {});
}

function giphy(query, message) {
	let queryString = encodeURIComponent(query);
	
	
	const
		request = require('request'),
		borderColor = 0xe0bc1b,
		rating = 'PG-13',
		giphyUrl = `https://api.giphy.com/v1/gifs/random?api_key=${process.env.GIPHY_APIKEY}&tag=${queryString}&rating=${rating}`;
	
	try {
		request.get(
			{
				url: giphyUrl,
				json: true
				/*,
				headers: {'User-Agent': 'request'} */
			}, 
			(err, res, data) => {
				if (err) {
					console.log('Error in giphy request:', err);
					if (message) message.react(na);
				} else if (res.statusCode !== 200) {
					if (message) message.react(res.statusCode == 429 ? wait : na);
					console.log('Giphy response status:', res.statusCode);
				} else {
					// data is already parsed as JSON:
					if (data.data) {
						const imgUrl = (data.data.image_url || data.data.images.fixed_height.url || data.data.images.downsized.url || null);
						if (imgUrl) {
							const imgFilename = query.replace(/\W+/g,'-') + '.' + (data.data.type || '.gif');
							message.channel.send(
								{
									embed: {
										color: borderColor,
										title: query,
										/*description: (data.data.title || ''),*/
										image: {
											url: 'attachment://' + imgFilename
										},
										footer: {
											text: (data.data.title || '')
										}
									},
									files: [{ attachment: imgUrl, name: imgFilename }] 
								}
							)
							.catch(()=>{});
						} else {
							message.react(na);
						}
					} else {
						console.log("Giphy - No URL:\n" + JSON.stringify(data).substring(0,180));
						message.react(na);
					}
				}
			}
		);
	} catch (err) {
		console.log('Giphy error', err);
		messager.react(wait);
	}
}

function weekDay(dayNum) {
	return ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'][dayNum%7];
}

function helpCmd(index) {
	const cmd = help[index%(help.length)];
	const allcmds = help.map((item) =>item.react+' '+item.name)
						.join(' | ');
	
	return '**' + cmd.trigger + '**'
		+ "\n" + cmd.desc
		+ (index ? "\n\n__Commands__:\n" + allcmds : '');
}

function replyHelp(message) {
	message.channel
	.send(helpCmd(0))
	.then(async sentMsg => {
		for (let r of help.map(i => (i.react || ''))) {
			if (r) {
				await sentMsg.react(r)
					.catch(e => console.log('Error in reactHelp:', e));
			}
		}
	})
	.catch(e => console.log('Reply help error:', e));
}

client.on('messageReactionAdd', (reaction, user) => {
	helpIndex = help.findIndex(item => item.react == reaction.emoji.name);
	if (reaction.me && user !== client.user && reaction.count > 1 && helpIndex>=0) {
		//reaction.message.channel.send(`${user} reacted with ${reaction.emoji.name}`);
		reaction.message
		.edit(helpCmd(helpIndex))
		.catch(e => console.log('Error editing', e));
	} else {
		console.log(reaction.me, user !== client.user, reaction.count > 1, help.some(item => item.react == reaction.emoji.name), reaction.users.has(client.user.id));
	}	
});

const rawEvents = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd'
	//, MESSAGE_REACTION_REMOVE: 'messageReactionRemove'
};
client.on('raw', async raw => {
	if (!rawEvents.hasOwnProperty(raw.t)) return;
	
	const {d: data} = raw;
	const user = client.users.get(data.user_id);
	const channel = client.channels.get(data.channel_id) || await user.createDM();
	
	if (channel.messages.has(data.message_id)) return; //prevent if we have cached as on normal event to react
	
	const message = await channel.fetchMessage(data.message_id);
	const emojiKey = data.emoji.id ? data.emoji.name + ':' + data.emoji.id : data.emoji.name;
	let reaction;
	if (message.reactions) { 
		reaction = message.reactions.get(emojiKey) || message.reactions.add(data);
	}
	if (!reaction) { //if last reaction removed
		const emoji = new Emoji(client.guilds.get(data.guild_id), data.emoji);
		reaction = new MessageReaction(message, emoji, 1, data.user_id === client.user.id);
	}
	client.emit(rawEvents[raw.t], reaction, user);
});

client.once('ready', () => {
    const buildMsg = 'Cluck cluck! :chicken:';
	const channel = client.channels.find(ch => ch.name === process.env.TEST_CHAN);
	if (channel) {
		channel.send(buildMsg);
	} else {
		console.log(buildMsg);
	}
	
	const now = new Date();
	client.user.setActivity('since '
		+ now.getUTCDate() + '/' + (now.getUTCMonth() + 1)
		+ ' ' + now.getUTCHours() + ':' + ('' + now.getUTCMinutes()).padStart(2, '0')
	, {type: "WATCHING"});
});

client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret from https://discordapp.com/developers/applications/me