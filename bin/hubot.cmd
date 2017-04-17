@echo off

call npm install
SETLOCAL
SET PATH=node_modules\.bin;node_modules\hubot\node_modules\.bin;%PATH%
SET HUBOT_GLIP_APP_KEY=
SET HUBOT_GLIP_APP_SECRET=
SET HUBOT_GLIP_USERNAME=
SET HUBOT_GLIP_EXTENSION=
SET HUBOT_GLIP_PASSWORD=
SET HUBOT_GLIP_SERVER=https://platform.devtest.ringcentral.com

node_modules\.bin\hubot.cmd --name "botathon" %* 
