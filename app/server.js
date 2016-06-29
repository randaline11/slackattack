// example bot
import botkit from 'botkit';

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
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention', 'ambient'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});


/*
// checking all messages now
controller.on(['message_received'], (bot, message) => {
  console.log(message);
  bot.reply(message, 'I heard you!');
});
*/

// checking all messages now
controller.on(['bot_message'], (bot, message) => {
//  console.log(message);
  console.log('bot id' + message.bot_id);
    // confirm that the message came from github bot
  if (message.bot_id === 'B1M5QB84F') {
    bot.reply(message, 'Github bot, is that you?');
    console.log('attachment index version2' + message.attachments[0].text);
    console.log('type:' + typeof message.attachments[0].text);
  } else {
    bot.reply(message, 'a new bot in Tronville?');
  }

      /*

  console.log('attachment' + message.attachments);
  console.log('attachment index version' + message.attachments[0]);
  console.log('attachment index version2' + message.attachments[0].text);
  console.log('attachment length' + message.attachments.length);

  */

});


controller.on('ambient', (bot, message) => {
  console.log(message);
  bot.reply(message, {
    text: 'A more complex response',
  });
});
