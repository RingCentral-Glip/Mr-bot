# Description:
#   Example scripts for you to examine and try out.
#
# Notes:
#   They are commented out by default, because most of them are pretty silly and
#   wouldn't be useful and amusing enough for day to day huboting.
#   Uncomment the ones you want to try and experiment with.
#
#   These are from the scripting documentation: https://github.com/github/hubot/blob/master/docs/scripting.md

config = require("../config.json")
_ = require('lodash')
ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3')

tone_analyzer = new ToneAnalyzerV3({
  username: config.credential.user,
  password: config.credential.password,
  version_date: '2016-05-19'
})
myselfId = null
glipClient = null
msgHandler = (user, res, emotion, text) ->
  anger = _.find(emotion.tones, {tone_id: "anger"})
  if anger.score >= 0.4
    glipClient.persons().get({personId: user.id}).then (personRes) ->
#     res.reply personRes.firstName + " " + personRes.lastName + ", please calm down"
      calmDown(personRes)
      report2Boss(personRes, text)

calmDown = (angryPerson) ->
  text = "**" + angryPerson.firstName + " " + angryPerson.lastName + ",** please calm down, just remember we, avengers, are a team"
  privateTalk(angryPerson.id, text)

report2Boss = (angryPerson, text) ->
  text = 'Director, negative emotion detected!\n' + "**" + angryPerson.firstName + " " + angryPerson.lastName + ' said:**' + text
  privateTalk(config.boss, text)

privateTalk = (targetUserId, text) ->
  glipClient.groups().post({type: "PrivateChat", members: [targetUserId]}).then (groupPutRes) ->
    glipClient.posts().post({groupId: groupPutRes.id, text: text})

toneAnalyze = (text, user, res) ->
  tone_analyzer.tone {text: text}, (err, tone) ->
    if err
      console.log err
    else
      console.log tone
      emotion = _.find(tone.document_tone.tone_categories, {category_id: "emotion_tone"})
      msgHandler user, res, emotion, text

initMyselfId = ->
  glipClient
    .persons()
    .get({personId: "~"})
    .then (response) -> myselfId = response.id


module.exports = (robot) ->
  glipClient = robot.adapter.client
  initMyselfId()
  robot.hear /.*/i, (res) ->
    user = res.message.user
    text = res.message.text
    if myselfId == user.id
      return
    toneAnalyze(text, user, res)
