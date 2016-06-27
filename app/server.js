import botkit from 'botkit';
// this is es6 syntax for importing libraries
// in older js this would be: var botkit = require('botkit')
// import Yelp from 'yelp';

// example bot
console.log('starting bot');

/*
const yelp = new Yelp({
  consumer_key: 'Et9qZ2uKjg6Tm3kEg3jMWA',
  consumer_secret: '1cjQXnCi-0EneFYa5qhE3mbw4Rw',
  token: '3CrQGbUI-Tq3QTcp-cTOLe8sgvOZsATr',
  token_secret: '31Mh1StaVgUn4rgrdv5Ls9s9sh0',
});
*/

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// example hello response
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
//  bot.reply(message, 'Hello there!');

  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

controller.hears(['pizzatime'], ['direct_message', 'direct_mention'], (bot, message) => {
  // askFlavor(response, convo);
  bot.startConversation(message, askFlavor);
//  bot.reply(message, 'pizzatime!');
});


/*
controller.hears(['hello'], ['direct_message', 'direct_mention'], (bot, message) => {
  // start a conversation to handle this response.
  bot.startConversation(message, (err, convo) => {
    convo.ask('How are you?', (response, convo2) => {
      convo2.say('Cool, you said: ${response.text}');
      convo2.next();
      convo.next();
    });
  });
});
*/

function askWhereDeliver(response, convo) {
  convo.ask('So where do you want it delivered?', (response2, convo2) => {
    convo2.say('Ok! Good bye.');
  //  convo.next();
    convo2.next();
  });
}
function askSize(response, convo) {
  convo.ask('What size do you want?', (response2, convo2) => {
    convo2.say('Ok.');
    askWhereDeliver(response2, convo2);
//    convo.next();
    convo2.next();
  });
}
function askFlavor(response, convo) {
  convo.ask('What flavor of pizza do you want?', (response2, convo2) => {
    convo2.say('Awesome.');
    askSize(response2, convo2);
//    convo.next();
    convo2.next();
  });
}
