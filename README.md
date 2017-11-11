# sample-bot-botbuilder-qna
Sample bot using Microsoft BotBuilder

## To install and setup

### Install it
```
npm install
```


## To run

To run it, you need a server (your bot, you can see the implementation in [app.js](./app.js)) and a chat interface.

### The bot

Run it with:
```
node app.js
```

### The test interface

You can use [Microsoft Bot Framework channel emulator](https://github.com/Microsoft/BotFramework-Emulator):

- Download, install and run it;
- Enter your bot endpoint: `http://localhost:3978/api/messages`;
- You don't need Microsoft credentials to run it locally, so just click `Connect`.

You should now be able to talk to your bot on this interface. 

