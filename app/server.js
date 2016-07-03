/*
Mr-Tron: a slackbot that tracks Github commits in channels
made by Abby Starr and Tim Tregubov
last revised: 7/3/2016
Uses Slack's bot user API and Google Spreadsheets API
Commented code for Github's API left in for potential future variations.
*/
import botkit from 'botkit';
import moment from 'moment';
import GoogleSpreadsheet from 'google-spreadsheet';
// import Github from 'github-api';  //Github API

// Authorization with Google
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

// Github API
/*
const gh = new Github({
  username: 'randaline11',
  password: process.env.GITHUB_PASSWORD,
});
*/

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
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

// initialize desired spreadsheet
const spreadsheet = new GoogleSpreadsheet(process.env.SPREADSHEET);

// all functions related to spreadsheet API
const Spreadsheets = {

  // authorizes and signs in google account app credentials
  getAuth() {
    return new Promise((fulfill, reject) => {
      console.log('getAuth');
      spreadsheet.useServiceAccountAuth((googleCreds), (err) => {
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

  // gets specific worksheet from spreadsheet based on channel name
  // spreadSheetName: the name of the desired worksheet
  // modeled after DALI Lab's HR bot
  getSpreadSheet(spreadsheetName) {
    let sheet;  // the desired worksheet
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
        }  // else
      });  // spreadsheet.getInfo API call
    });  // promise
  },

  // adds a new row to the worksheet with the commit info
  // sheet: the worksheet
  // username: username of person who made commit
  // text: commit message
  // url: link to the commit
  addInfo(sheet, username, text, url) {
    console.log('adding commit to the worksheet...');
    return new Promise((fulfill, reject) => {
      const now = moment();
      sheet.addRow({ date: now, username, text, url }, (err, row) => {
        if (row) {
          fulfill(row);
        } else {
          reject(err);
          logErrors(err, 'addInfo');
        }
      });  // sheet
    });  // promise
  },

};  // Spreadsheets object

// All functions related to Slack API
const BotStuff = {

  // gets the channel name.
  // bot: the message bot object created with botkit
  // message: object returned from an event
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
          logErrors(err, 'getChannel');
        }
      });  // channel name
    });  // promise
  },

  // gets everything from channel needed for input into worksheet
  // message: object returned from an event
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

};  // end of BotStuff object

// uses an extra spreadsheet to keep track of all errors
// err: the error message from rejected promise
// functionName: the function the error message came from
function logErrors(err, functionName) {
  console.log('there was an error somewhere. adding error to log worksheet');
  const now = moment();
  Spreadsheets.getSpreadSheet('errors').then((sheet) => {
    sheet.addRow({ date: now, functionName, err }, (err, row) => {
      if (row) {
        console.log('logged error in errors worksheet');
      } else {
        console.log(`'failed to log error. was: ${err} in ${functionName}`);
      }
    });  // sheet.addRow API call
  });  // getSpreadsheet
}

// checking all messages now
controller.on(['bot_message'], (bot, message) => {
  console.log(`bot id ${message.bot_id}`);
    // confirm that the message came from github bot
  if (message.bot_id === 'B1M5QB84F') {  // ID belongs to Github Bot
    bot.reply(message, 'Github bot, is that you?');

    // then start main promise chain
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
      console.log('done!');
    });

    // commented out code for use with Github API
    /*
    const fallback = message.attachments[0].fallback;
    console.log('fallback: ' + fallback);
    const processFallback = fallback.split(' ');
    const commitName = processFallback[processFallback.length - 1];  // person who made commitName
    const url = processFallback[0].split('/');  // url of repo in array form
    console.log('url is ' + url);
    const owner = url[3];
    const repo = url[4];
    const processMore = processFallback[1].split('|')[0].split('/');
    const sha = processMore[(processMore.length - 1)];
    const tempSha = '70ce05550b90f7872e84fcc99ad0346201b74a2e';
    console.log( 'sha: ' + sha);
    const commitCheck = gh.getRepo(owner, repo);
    console.log(commitCheck);
    commitCheck.getCommit(tempSha, (err, res) => {
      if (res) {
        console.log(res);
      }
      else {
        console.log(err);
      }
    });
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

// example hello response -- taken from slackattack guide
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention',
'mention', 'ambient'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
      console.log(googleCreds.type);
      console.log(googleCreds.project_id);
      console.log(googleCreds.private_key_id);
      console.log(googleCreds.private_key);
      console.log(googleCreds.client_email);
      console.log(googleCreds.client_id);
      console.log(googleCreds.auth_uri);
      console.log(googleCreds.token_uri);
      console.log(googleCreds.auth_provider_x509_cert_url);
      console.log(googleCreds.client_x509_cert_url);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});
