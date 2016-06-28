import botkit from 'botkit';
// this is es6 syntax for importing libraries
// in older js this would be: var botkit = require('botkit')
import Yelp from 'yelp';

// attempt to use webhook token
const DOMAIN_OUT_TOKEN = 'ZWbHwUaC41EhAChhlDOFGkEP';

const yelp = new Yelp({
  consumer_key: 'Et9qZ2uKjg6Tm3kEg3jMWA',
  consumer_secret: '1cjQXnCi-0EneFYa5qhE3mbw4Rw',
  token: '3CrQGbUI-Tq3QTcp-cTOLe8sgvOZsATr',
  token_secret: '31Mh1StaVgUn4rgrdv5Ls9s9sh0',
});

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,

  // maybe?
  domain_out_token: DOMAIN_OUT_TOKEN,

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

// added code for outgoing webhook
controller.on('outgoing_webhook', (bot, message) => {
  console.log(bot);
  console.log(message);
  bot.replyPublic(message, '(sigh) fiiiine...');

  /*
  bot.api.channels.history({ channel: message.channel }, (err, res) => {
    console.log(res);
    console.log(typeof res);
    console.log(message);
    bot.replyPublic(message, 'yeahhhh.....');
*/
//  });  // history
});

// example hello response
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

/*
// let's make him hear more
controller.hears(['yeahhhh'], ['direct_message', 'ambient'], (bot, message) => {
  bot.api.im.history({ channel: message.channel }, (err, res) => {
    if (res) {
      console.log(res);
      console.log(typeof res);
      console.log(res.latest);
      console.log(message);
      bot.reply(message, 'I like the enthusiasm!');

    } else {
      bot.reply(message, '...yeah?');
    }
  });
});

*/
controller.hears(['hungry'], ['direct_message', 'direct_mention'], (bot, message) => {
  bot.startConversation(message, askTerm);
});

function respond(name, phone, url, destruct) {
  controller.hears(['ready'], ['direct_message'], (bot, message) => {
    if (destruct) {
      bot.reply(message, 'self-destructing now....');
      setTimeout(bot.destroy.bind(bot), 1000);
    } else
    {
      bot.reply(message, name);
      bot.reply(message, phone);
      bot.reply(message, url);
    }
  });
}

function askWhereDeliver(response, convo) {
  convo.ask('So where do you want it delivered?', (response2, convo2) => {
    convo2.say('Ok! Good bye. type ready for your food recommendations!');
    convo2.next();

    // handle conversation end and extract responses
    convo2.on('end', (convo3) => {
      if (convo3.status === 'completed') {
        const term = convo3.extractResponse('term');
        const miles = (parseInt(convo3.extractResponse('miles'), 10) * 1609.34);
        const location = convo3.extractResponse('location');

        // integrate Yelp search
        yelp.search({ term, location, radius_filter: miles, limit: 1 })
        .then((data) => {
          /*
          data.businesses.forEach(business => {
            console.log(business.name);
            respond(data.businesses[0]name, data.businesses[0].phone, data.businesses[0].url, false);
          });
          */
        //  respond('', '', '', true);
      //    console.log(data.businesses[0].name);
          respond(data.businesses[0].name, data.businesses[0].phone, data.businesses[0].url, false);
        })
          .catch((err) => {
            console.error(err);
          });
      } else {
        console.log('didnt complete');
      }  // else
    });  // convo2.on end
  }, { key: 'location' });  // convo.ask
}  // askWhereDeliver

function askMiles(response, convo) {
  convo.ask('how far are you willing to go in miles?', (response2, convo2) => {
    convo2.say('Ok.');
    askWhereDeliver(response2, convo2);
    convo2.next();
  }, { key: 'miles' });
}

function askTerm(response, convo) {
  convo.ask('What kind of food do you want?', (response2, convo2) => {
    convo2.say('Awesome.');
    askMiles(response2, convo2);
    convo2.next();
  }, { key: 'term' });
}
