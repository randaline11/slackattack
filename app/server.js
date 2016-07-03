import botkit from 'botkit';
import Github from 'github-api';
import moment from 'moment';

// Note: There are better APIs out there, but not many for Node and all use
// google's v3 API version, which will eventually be deprecated. Therefore,
// direct google-spreadsheet is the better choice.
import GoogleSpreadsheet from 'google-spreadsheet';
// taken from Dali Lb's hr-bot


const googleCreds = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
};

const spreadsheet = new GoogleSpreadsheet(process.env.SPREADSHEET);

const Spreadsheets = {

  // authorizes and signs in google account app credentials
  getAuth() {
    return new Promise((fulfill, reject) => {
      console.log('getAuth');
      spreadsheet.useServiceAccountAuth((googleCreds), (err) => {
        console.log('got into the function?');
        if (err) {
          reject(err);
          console.log('the getAuth promise was rejected....');
          console.log(err);
        } else {
          fulfill();
          console.log('the getAuth promise was fulfilled!');
        }
      });
    });
  },

  // gets specific sheet from spreadsheet
  getSpreadSheet(spreadsheetName) {
    let sheet;
    console.log(`getSpreadSheet: ${spreadsheetName}`);
    return new Promise((fulfill, reject) => {
      spreadsheet.getInfo((err, sheetInfo) => {
        if (err) {
          reject(err);
          console.log('the promise for getSpreadheet was rejected...');
        } else {
          sheet = sheetInfo.worksheets.filter((worksheet) => {
            return worksheet.title === spreadsheetName;
          })[0];

          if (sheet) {
            console.log(`found sheet: ${spreadsheetName}`);
            fulfill(sheet);
          } else {
            reject(new Error(`couldn't find spreadsheet: ${spreadsheetName}`));
          }
        }
      });
    });
  },

  // adds a new row with the commit info
  addInfo(sheet, username, text, url) {
    return new Promise((fulfill, reject) => {
      const now = moment();
      sheet.addRow({ date: now, username, text, url }, (err, row) => {
        if (row) {
          fulfill(row);
        } else {
          reject(err);
        }
      });  // sheet
    });  // promise
  },

};  // Spreadsheets object

const gh = new Github({
  username: 'randaline11',
  password: process.env.GITHUB_PASSWORD,
});

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
      console.log(process.env.SPREADSHEET);

      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

const BotStuff = {
  getChannel(bot, message) {
    console.log('getting channel name');
    return new Promise((fulfill, reject) => {
      const channelId = message.channel;
      bot.api.channels.info({ channel: channelId }, (err, res) => {
        if (res) {
          console.log(`channel name: ${res.channel.name}`);
          fulfill(res.channel.name);
        } else {
          reject(err);
        }
      });  // channel name
    });  // promise
  },

  getOtherVars(message) {
    console.log('in getOtherVars');
    const messageText = message.attachments[0].text.split(' ');
    const username = messageText[(messageText.length - 1)];
    const commitText = messageText[2];
    const url = messageText[0].split('|')[0].replace("`", '').replace('<', '');
    const completedVars = [username, commitText, url];
    console.log(`the completed vars section is: ${completedVars}`);
    return completedVars;
  },

};  // the big one

// checking all messages now
controller.on(['bot_message'], (bot, message) => {
  console.log(`bot id ${message.bot_id}`);
    // confirm that the message came from github bot
  if (message.bot_id === 'B1M5QB84F') {
    bot.reply(message, 'Github bot, is that you?');

    Spreadsheets.getAuth().then((name) => {
      return BotStuff.getChannel(bot, message);
    })
    .then((name) => {
      return Spreadsheets.getSpreadSheet(name);
    })
    .then((sheet) => {
      const addThis = BotStuff.getOtherVars(message);
      return Spreadsheets.addInfo(sheet, addThis[0], addThis[1], addThis[2]);
    })
    .then((row) => {
      console.log(`youre done! ${row}`);
    });

    /*
    const fallback = message.attachments[0].fallback;
    console.log('fallback: ' + fallback);

    const processFallback = fallback.split(' ');
    const commitName = processFallback[processFallback.length - 1];  // person who made commitName
    const url = processFallback[0].split('/');  // url of repo in array form
    console.log('url is ' + url);
    const owner = url[3];
    const repo = url[4];
    console.log('owner is: ' + owner);
    console.log('repo is ' + repo);

*/
    // getting sha for github
    /*

    const processMore = processFallback[1].split('|')[0].split('/');
    const sha = processMore[(processMore.length - 1)];
    const tempSha = '70ce05550b90f7872e84fcc99ad0346201b74a2e';
    console.log( 'sha: ' + sha);

    const commitCheck = gh.getRepo(owner, repo);
    console.log(commitCheck);
    commitCheck.getCommit(tempSha, (err, res) => {
      if (res) {
        console.log(res);
        console.log('____________');
        console.log(res.author);
        console.log('____________');
        console.log(res.stats);
      }
      else {
        console.log(err);
      }

    });
    */

    // now query github to get more cool info
    /*
    const commitInfo = gh.getCommit(sha, (err, res) => {
      if (res) {
        console.log(res);
      } else {
        console.log('couldnt find a response to github request');
      }
    });
    */
  } else {
    bot.reply(message, 'a new bot in Tronville?');
  }
});


controller.on('ambient', (bot, message) => {
  console.log(message);
  bot.reply(message, {
    text: 'A more complex response',
  });
});
