# DB Request for Humans
Sample bot using Microsoft BotBuilder

## Main principles

This bot uses the Microsoft Bot Framework. It is meant for users that want to request databases without any technical knowledge. It provides a user-friendly interface where the user can enter command-line-styled instructions for the bot. The main interest compared to a pure command line software is its flexibility, since it allows users to make small mistakes, and its customizability (the language used by the user to communicate with the bot can be very easily modified).

On a technical standpoint, the bot frontend is mainly written in Node.js. The API calls are written in JS ES6, then transpiled using Babel. The backend is a Python Flask app. For now, the backend is fake, it simulates how a true backend would analyse the user's sentences and build a reply.

## To install and setup

### Install it

To install the frontend:

```
npm install
```

To transpile JS ES6:

```
npm run build
```

For the backend, you can for example run it in a conda env. You need the following packages : Flask, Flask-RESTful, Flask-Cors.

## To run

To run it, you need to run the frontend (you can see the implementation in [app.js](./app.js)), the backend and a chat interface.

### Frontend

Run it with:
```
node app.js
```

### Backend

Run it with:
```
python run.py
```

### The test interface

You can use [Microsoft Bot Framework channel emulator](https://github.com/Microsoft/BotFramework-Emulator):

- Download, install and run it;
- Enter your bot endpoint: `http://localhost:3978/api/messages`;
- You don't need Microsoft credentials to run it locally, so just click `Connect`.

You should now be able to talk to your bot on this interface. 

## Examples of request

The following prompts are keywords for the bot:

```
// to review the current state of your request:
%review
// to go back one step in your request:
%back
// to enter the help menu:
%help
// to learn some info about the DB structure:
%explore
// to send your request for treatment:
%send
// to cancel your request:
%cancel
```

To test the bot's functionalities, you can enter the following prompts, which simulate a typical workflow:

```
Hello
%explore
toto tata titi
foo baa
%review
%back
foo bar
%review
%send
```

## Word of Thanks

To [oscar6echo](https://github.com/oscar6echo), from whom originated the idea of this bot, and whose suggestions and help contributed to this project.

To the people at [Botfuel](https://github.com/Botfuel) for their warm welcome and their help on this project.

## Tips about Microsoft Bot Framework

See [here](./tips.md).