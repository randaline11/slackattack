import botkit from 'botkit';
import Github from 'github-api';
import moment from 'moment';
// var dotenv = require('dotenv');
//import dotenv from 'dotenv';
// dotenv.load();
// import dotenv from 'dotenv';
// Note: There are better APIs out there, but not many for Node and all use
// google's v3 API version, which will eventually be deprecated. Therefore,
// direct google-spreadsheet is the better choice.
import GoogleSpreadsheet from 'google-spreadsheet';

// const myEnv = dotenv.config();
// taken from Dali Lb's hr-bot


var googleCreds = {
  "type": process.env.TYPE,
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
};




/*
var googleCreds = {};
googleCreds["type"] = process.env.TYPE;
googleCreds["project_id"] = process.env.PROJECT_ID;
googleCreds["private_key_id"] = process.env.PRIVATE_KEY_ID;
googleCreds["private_key"] = process.env.PRIVATE_KEY;
googleCreds["client_email"] = process.env.CLIENT_EMAIL;
googleCreds["auth_uri"] = process.env.AUTH_URI;
googleCreds["token_uri"] = process.env.TOKEN_URI;
googleCreds["auth_provider_x509_cert_url"] = process.env.AUTH_PROVIDER_X509_CERT_URL;
googleCreds["client_x509_cert_url"] = process.env.CLIENT_X509_CERT_URL;
*/

/*
var googleCreds = {
    "type": "service_account",
    "project_id": "mrtron-1358",
    "private_key_id": "388e9e8e3d998c4d34c96d514eb5e0d042fe1ae7",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCm4UpQeDz2G2C+\nEMH3Kb5eG5rSviW90rpkEtOq9BdSTiia8AV5SuY3uTOAoHcrQDzKyjfIF112OnfJ\nnOYXNrgfL0x66Ko+tqZqYF419QuCQIBuTlzjI83228serHVyjRcTnmmqWuj3aC0u\nSysMDXXfH9ff7ca6v+1OTbPeBzdAvhuyuyO2U/QrRZ8Hj66c0x5XZeDgsiWhUilc\nccwHCv7fjNIukBzh4uvcChBlHLyrkNNCJ0kvkyzw0c1T2mQnEqUGiW5jsGQmbe2y\nywPKyrugfVaOVw6X9IWaIDa5M+zRHA6mZwDXtBZjL+MPf/LaCQsQrjvae1ROg5PY\nizBMV+VfAgMBAAECggEBAIwshyiqpsIu4wcjulmrZa1U0Kqeb8NP46K1sbhSSdin\nsDHc1Sw5/sDlvt4Xa6IX1jicvVhEUAxENmRSd28eVnBTYZGIJ6B/+a82/UujZqRl\nG7wL9LgSVio6GxbL0+eBndWr5aPjsvZGOlU9bI42LEFcVQ9SgfBR0LpKSICCXSXy\naE4yF90G3axGwxZ5XCF6U/Gv3tDHYYpTBEY9nwWqEtt1MQjIwttuFkArTcGzqur7\nC3xr2L7hQRYlZT4YwtfxvxYYOZyO/h7H928RR6D8d1q5ToWGYpT5IqRCeuHJYoh9\ni8iIYPRyjQVzH8HqQ1q5iONRfRErzf4XPSX0LU5YyAkCgYEA+pcaOEFkE4ui3bIB\nXWNtKxi2ceqRvxyag6LKM+UofQPEyf7QCWW0LO6tL7ybgU0jDOKZtSxPmLUqpdYC\nI01VH77Rlks0wOfVYEzGM/nxT02YcS6H6u/WIMeANpY7us/HiL6aXKcKCVvWDPxz\nmBR622hGcdfuMTxHOuW5hsvQU1MCgYEAqnuPVOdzJU8yG1imqMmSkZ5wHHlm4DYm\noF3jhdTqYMJWu2A9scd8oKlDrpnsf/bEURQhmrcatiHxetak52MxtMVS9axW9iEz\nR48BDkA522ER892d7aBto3PZZ4l8hDJtwnB7tnnt0tyJ5Hxe15fcb4XCF+3VmUtT\n4JvxfP7K0EUCgYAhd+bvloQ4PBEfjPOztmDRPba4VjzrCnX0mNxqu/OBZux0kgzV\nBHlg+uu0kXsvdM72nJks4mMrIR82EPQuJNj2qXSynw7HqO8NspNSQ9Kf5dwzWaSb\nkzbFIAAWyk/l7nRW5iYVs9WaVGKtT1Zc/HdAMJggAlf0yXk1+5Kg1z3WswKBgQCe\ncu6Ze/AyGfQ5JGDpeUdnXjlWzaLG+q1V2U1xAp2/xn/z8RQGGqGDdS45pkf/+usl\nbC97a3lBFDUq9ToY8MGvAMMFIONGKT9O3+OcSic79XFJFY4F4FhmVXMXXtpCx9fp\nor/orlRS6bSjjtBbUoKHiGsH8H3Y1wEjPezpPqpjfQKBgQC62ikT8GlW6C73QMdJ\n26QoT6jEaztk9lO5X1e/7Dazhsk2kjLCJi+E14ofBmSJeFKCT5xZ3TLHUxNwL31M\nXf9x7ckVkldVRx4wzDLGh4CQEJGM9j0d9Sj4vz3mSE4jxCWWy9Urd4Ef7d9yzvO7\niyFgJqI29EfxN91cR18tL0MJHA==\n-----END PRIVATE KEY-----\n",
    "client_email": "administrator@mrtron-1358.iam.gserviceaccount.com",
    "client_id": "113996160067789863916",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/administrator%40mrtron-1358.iam.gserviceaccount.com"
  }
  */


// var googleCreds = require('./newKeys.json');
// var googleCreds = require('./mrtron-388e9e8e3d99.json');

const spreadsheet = new GoogleSpreadsheet('1dOpM5PvnxTqBRrzk2TUaqRiYSKUnS7azPlc0EK5EDek');

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

};  // main one

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
      console.log(process.env.TYPE);
      console.log(process.env.PROJECT_ID);
      console.log(process.env.PRIVATE_KEY_ID);
      console.log(process.env.PRIVATE_KEY);
      console.log(process.env.CLIENT_EMAIL);
      console.log(process.env.CLIENT_ID);
      console.log(process.env.AUTH_URI);
      console.log(process.env.TOKEN_URI);
      console.log(process.env.AUTH_PROVIDER_X509_CERT_URL);
      console.log(process.env.CLIENT_X509_CERT_URL);
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
          console.log('channel name: ' + res.channel.name);
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
    const url = messageText[0].split('|')[0].split("'<'");
    const completedVars = [username, commitText, url];
    console.log('the completed vars section is: ' + completedVars);
    return completedVars;
  },

};  // the big one

// checking all messages now
controller.on(['bot_message'], (bot, message) => {
  console.log('bot id' + message.bot_id);
    // confirm that the message came from github bot
  if (message.bot_id === 'B1M5QB84F') {
    bot.reply(message, 'Github bot, is that you?');

    // throw in a basic test function
    /*
    Spreadsheets.getAuth().then(() => {
      return Spreadsheets.getSpreadSheet('tronville');
    }).then((sheet) => {
      return Spreadsheets.addInfo(sheet, 'me', 'hello', 'urlllllll');
    });
    */

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
      console.log('youre done!' + row);
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
