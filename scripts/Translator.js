// Description:
//     Example scripts for you to examine and try out.
//
// Notes:
//     They are commented out by default, because most of them are pretty silly and
//   wouldn't be useful and amusing enough for day to day huboting.
//   Uncomment the ones you want to try and experiment with.
//
//   These are from the scripting documentation: https://github.com/github/hubot/blob/master/docs/scripting.md

const md5 = require('md5');
const _ = require('lodash');
const http = require('http');

const appId = '20170406000044267';
const appKey = 'lTuEOA_fYuFQE8N_HdMq';

let glipClient;
let robotUserId;

module.exports = (robot) => {
  glipClient = robot.adapter.client;
  initRobotUserId();
  robot.hear(/.*/, (res) => {
    const user = res.message.user;
    user.id !== robotUserId && messageHandler(res);
  });
};

function initRobotUserId() {
  glipClient.persons().get({personId: '~'})
    .then(data => robotUserId = data.id);
}


function detectLanguage(text) {
  const enCharCount = _.get(text.match(/[A-Za-z]/g), 'length', 0);
  return enCharCount > text.length / 2 ? 'en' : 'zh';
}

function messageHandler(res) {
  const text = res.message.text;

  const translationRules = {
    en: 'zh',
    zh: 'en'
  };

  const url = buildRequestUrl(text, translationRules[detectLanguage(text)]);
  requestTranslate(url, (result) => {
    const dst = result.trans_result[0].dst;
    glipClient.persons().get({personId: res.message.user.id})
      .then(data => {
        const userName = `${data.firstName} ${data.lastName}`;
        const replyText = `**${userName} says:** ${dst}`;
        res.send(replyText);
      });
  });
}

function requestTranslate(url, callback) {
  http.get(url, response => {
    const statusCode = response.statusCode;
    const contentType = response.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error(`Invalid content-type.\nExpected application/json but received ${contentType}`);
    }
    if (error) {
      console.log(error.message);
      response.resume();
      return;
    }

    response.setEncoding('utf8');
    let rawData = '';
    response.on('data', chunk => rawData += chunk);
    response.on('end', () => {
      try {
        let parsedData = JSON.parse(rawData);
        callback(parsedData);
      } catch (e) {
        console.log(e.message);
      }
    });
  }).on('error', e => console.log(`Got error: ${e.message}`));
}

function buildRequestUrl(q, to) {
  const baseUrl = 'http://api.fanyi.baidu.com/api/trans/vip/translate';
  const salt = (new Date()).getTime();
  const params = {
    q: encodeURIComponent(q),
    from: 'auto',
    to: to,
    appid: appId,
    salt: salt,
    sign: md5(`${appId}${q}${salt}${appKey}`)
  };

  const queryString = _.reduce(params, (accumulated, value, key) => {
    accumulated.push([key, value].join('='));
    return accumulated;
  }, []).join('&');

  return [baseUrl, queryString].join('?');
}
