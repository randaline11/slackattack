import botkit from 'botkit';
import Github from 'github-api';

// Note: There are better APIs out there, but not many for Node and all use
// google's v3 API version, which will eventually be deprecated. Therefore,
// direct google-spreadsheet is the better choice.
import GoogleSpreadsheet from 'google-spreadsheet';

// taken from Dali Lb's hr-bot
/*
var googleCreds = {
  client_email: process.env.CLIENT_EMAIL,
  private_key: process.env.PRIVATE_KEY,
  client_id: process.env.CLIENT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  type: process.env.TYPE,
};
*/

var googleCreds = require('./mrtron-388e9e8e3d99.json');

const spreadsheet = new GoogleSpreadsheet('1dOpM5PvnxTqBRrzk2TUaqRiYSKUnS7azPlc0EK5EDek');

const Spreadsheets = {

  // authorizes and signs in google account app credentials
  getAuth() {
    return new Promise((fulfill, reject) => {
      console.log('getAuth');
      spreadsheet.useServiceAccountAuth(googleCreds, (err) => {
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
    console.log('getSpreadSheet: ' + spreadsheetName);
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
            console.log('found sheet: ' + spreadsheetName);
            fulfill(sheet);
          } else {
            reject(new Error("couldn't find spreadsheet: " + spreadsheetName));
          }
        }
      });
    });
  },

};  // main one

Spreadsheets.getAuth().then(() => {
  return Spreadsheets.getSpreadSheet('tronville');
}).then((sheet) => {
  console.log(sheet);
});

/*
Spreadsheets.getAuth().then(spreadsheet.getInfo((err, sheet_info) => {
  if (err) {
    console.log('there was an error');
  } else {
    var sheet = sheet_info.worksheets.filter((worksheet) => {
    //  return worksheet.title == spreadsheetName;
      console.log('worksheet title is ' + worksheet.title);
    })[0];
  } // else
}));
*/

/*
Spreadsheets.getAuth().then(() => {
  return spreadsheet.getInfo((err, sheetInfo) => {
  console.log('getting sheet info....');
  if (err) {
    console.log('there was an error');
    console.log('error was' + err);
  } else {
    console.log('success!');
    console.log(sheetInfo);
  }
  });  // get info
});  // get auth
*/


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
  console.log('bot id' + message.bot_id);
    // confirm that the message came from github bot
  if (message.bot_id === 'B1M5QB84F') {
    bot.reply(message, 'Github bot, is that you?');
    // get what's needed from the github bot
  //  const channel = message.channel;
    // let text = message.attachments[0].text;

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

    // getting sha for github
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


/*
    const yahoo = gh.getOrganization('yahoo');
    yahoo.getRepos((err, repos) => {
      console.log(repos);
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


  //  console.log('attachment index version2' + message.attachments[0].text);
  //  console.log('type:' + typeof message.attachments[0].text);
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
