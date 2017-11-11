var builder = require('botbuilder');
const restify = require('restify');
var api = require('./client_js/dist/api')
const {
    WELCOME_MESSAGE,
    RETRY_PROMPT,
    WAIT_PROMPT,
    ASK_FOR_REQUEST_SPECIFICATION,
    ASK_AGAIN_FOR_REQUEST_SPECIFICATION,
    ASK_FOR_REQUEST_FROM_BACK_DIALOG,
    CONFIRM_PROMPT,
    END_OF_CONVERSATION,
    READY_FOR_SENDING,
    READY_FOR_SENDING_AGAIN,
    ERROR_PROMPT
  } = require('./messages');

// Create a server
const server = restify.createServer();
server.listen(3978, () => {
  console.log('%s listening to %s', server.name, server.url);
});

// Instantiate the Bot builder connector and bot
const connector = new builder.ChatConnector({
  // can be left undefined when testing with emulator
  appId: process.env.MICROSOFT_APP_ID,
  // can be left undefined when testing with emulator
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// Create route /api/messages to communicate with your chat interface
server.post('/api/messages', connector.listen());

// Setup bot and root waterfall
var bot = new builder.UniversalBot(connector, [
    function (session) {
        // welcome message
        session.send(WELCOME_MESSAGE);
        session.conversationData.prompts = [];
        session.conversationData.history_states_of_request = [[{}, false]];
        // session.conversationData.requestIsReady = false;
        session.beginDialog('main');
    }
]);

bot.dialog('main', [
    function(session, args){
        // asks user for necessary information before being able to send request
        session.beginDialog('specifyRequest', args);
    },
    function (session, results) {
        // says request is ready, but user can still precise his request
        session.beginDialog('readyForSending');
    }   
]);

bot.dialog('specifyRequest', [
    function (session, args) {
        console.log('beg of specify request')
        console.log(args)
        if (args && args.origin == 'self') {
            builder.Prompts.text(session, ASK_AGAIN_FOR_REQUEST_SPECIFICATION,{retryPrompt: RETRY_PROMPT});
        } else if (args && args.origin == 'backDialog'){
            builder.Prompts.text(session, ASK_FOR_REQUEST_FROM_BACK_DIALOG,{retryPrompt: RETRY_PROMPT});
        }
        else {
            builder.Prompts.text(session, ASK_FOR_REQUEST_SPECIFICATION, {retryPrompt: RETRY_PROMPT});
        }
    },
    function(session, results, next){
        console.log('make the user wait')
        var msg = new builder.Message(session)
        .text(WAIT_PROMPT)
        .inputHint(builder.InputHint.ignoringInput);    // does not have any effect in the emulator
        session.send(msg)
        session.sendBatch() // to send message immediately

        // simulate long request
        setTimeout(function(){next(results);}, 5000)
        // next(results)
    },
    function (session, results) {   
        console.log('end of specify request')
        sendToSpecify(session, results).then(
            function(ready){
                console.log(ready)
                if (ready){     // move to next dialog in waterfall
                    session.endDialog()        
                }
                else {          // replay the same dialog
                    session.replaceDialog('specifyRequest', { origin: 'self' })
                }
            }
        )
    }
]).beginDialogAction('reviewAction', 'reviewRequest', {
    matches: /^%review$/i
}).beginDialogAction('backAction', 'backDialog', {
    matches: /^%back/i
})// Once triggered, will end the conversation.
.endConversationAction('endConversationAction', END_OF_CONVERSATION, {
    matches: /^%cancel$/i,
    confirmPrompt: CONFIRM_PROMPT
});

bot.dialog('readyForSending', [
    function (session, args) {
        console.log('args')
        console.log(args)
        if (args && args.origin == 'self') {
            builder.Prompts.text(session, READY_FOR_SENDING_AGAIN, {retryPrompt: RETRY_PROMPT});
        } 
        else if (args && args.origin == 'request_sent'){
            builder.Prompts.text(session, RETRY_PROMPT, {retryPrompt: RETRY_PROMPT});            
        }
        else {
            builder.Prompts.text(session, READY_FOR_SENDING, {retryPrompt: RETRY_PROMPT});
        }
    },
    function (session, results) {
        sendToSpecify(session, results).then(
            function(ready){
                console.log(ready)
                if (ready){
                    session.replaceDialog('readyForSending', { origin: 'self' });
                }
                else {
                    session.replaceDialog('main', { origin: 'ready_for_sending' });
                }
            }
        )
    }
]).beginDialogAction('reviewAction', 'reviewRequest', {
    matches: /^%review$/i
}).beginDialogAction('sendAction', 'requestSent', {
    matches: /^%send/i
}).beginDialogAction('backAction', 'backDialog', {
    matches: /^%back/i
}).endConversationAction('endConversationAction', END_OF_CONVERSATION, {
    matches: /^%cancel$/i,
    confirmPrompt: CONFIRM_PROMPT   // ask the user for confirmation before erasing the conversation
});

bot.dialog('requestSent', function (session, args, next) {
    //Send the request to backend for treatment
    var msg = new builder.Message(session)
    .text(WAIT_PROMPT)
    .inputHint(builder.InputHint.ignoringInput);    // does not have any effect in the emulator
    session.send(msg)
    session.sendBatch() // to send message immediately

    return new Promise(function(resolve, reject) {
        console.log('in promise of requestSent')
        array = session.conversationData.history_states_of_request
        current_request = array[array.length - 1][0]
        api.default.Post('/compute', {'sentence':session.message.text, 'state_of_request':current_request},
        function(response){
            console.log('response')
            console.log(response.data)
            if (! response.data.request_successful){
                session.send(ERROR_PROMPT)
                reject('error') 
            }
            response.data.sentences.forEach(function(sentence){
                session.send(sentence);
            });
            console.log("Returning to parent dialog...")
            session.replaceDialog('readyForSending', {origin:'request_sent'});
            resolve()
        }, 
        function(error){
            console.log('error')
            session.send(ERROR_PROMPT)
            console.log("Returning to parent dialog...")
            session.replaceDialog('readyForSending', {origin:'request_sent'});
            reject('error')
        })   
    })
})

bot.dialog('reviewRequest', function (session, args, next) {
    // Review the request current state
    session.send('Reviewing request...');
    array = session.conversationData.history_states_of_request
    current_request = array[array.length - 1][0]
    console.log(current_request)
    var keys = Object.keys(current_request);
    keys.forEach(function(key){
        session.send('column ' + key + ' with value ' + current_request[key]);
    });
    console.log("Returning to parent dialog...");
    session.endDialog();
})

bot.dialog('backDialog', [function (session, args, next) {
    // Back up to the previous state of request
    session.send('Backing one step up...');
    array = session.conversationData.history_states_of_request
    if (array.length > 1){
        array.pop()
    }
    else{
        session.send('You already went back to initial state, cannot go back anymore.')
    }
    next()
}, function (session, args, next){
    session.beginDialog('reviewRequest');
}, function(session, args){
    ready = array[array.length-1][1]
    if (ready){
        session.replaceDialog('readyForSending', {origin:'backDialog'})
    }
    else {
        session.replaceDialog('main', {origin:'backDialog'})
    }
}]);


bot.dialog('explore', 
    function (session, args, next) {
        session.send('Exploring mode');

        return new Promise(function(resolve, reject) {
            console.log('in promise of exploring')
            api.default.Post('/exploration', {'sentence':session.message.text},
            function(response){
                console.log('response')
                console.log(response.data)
                if (! response.data.request_successful){
                    session.send(ERROR_PROMPT)
                    reject('error') 
                }
                response.data.sentences.forEach(function(sentence){
                    session.send(sentence);
                });
                console.log("Returning to parent dialog...")
                session.endDialog()
                resolve()
            }, 
            function(error){
                console.log('error')
                session.send(ERROR_PROMPT)
                console.log("Returning to parent dialog...")
                session.endDialog()
                reject('error')
            })   
        })
    })
// Once triggered, will start a new dialog as specified by
// the 'onSelectAction' option.
.triggerAction({
    matches: /^%explore/i,
    onSelectAction: (session, args, next) => {
        // Add the explore dialog to the top of the dialog stack 
        // (override the default behavior of replacing the stack)
        session.beginDialog(args.action, args)
    }
});

// Example help dialog, to indicate a possible structure.
bot.dialog('help', [
    function (session, args, next) {
        session.send('This is an interactive help menu');
        builder.Prompts.choice(session, "What do you want to know about:", 'General Bot description|Link to github detailed doc|Examples');
    },
    function (session, results) {
        session.dialogData.path = results.response.index;
        builder.Prompts.choice(session, "Which level of verbosity:", 'Low|High');
    },
    function (session, results) {
        verbose = results.response.index
        switch (session.dialogData.path) {
            case 0:
                if (verbose){
                    session.send('Here is the very verbose bot description')
                }
                else{
                    session.send('Here is the general bot description')
                }        
                break;
            case 1:
                session.send('Here are the link to github');
                break;
            case 2:
                session.send('Here are some examples');
                break;
        }
        builder.Prompts.choice(session, "Exit help?", 'Yes|No');
    },
    function (session, results) {
        decision = results.response.index;
        if (decision == 1){
            session.replaceDialog('help')
        }
        else{
            session.endDialog()
        }
    }
])
// Once triggered, will start a new dialog as specified by
// the 'onSelectAction' option.
.triggerAction({
    matches: /^%help$/i,
    onSelectAction: (session, args, next) => {
        // Add the help dialog to the top of the dialog stack 
        // (override the default behavior of replacing the stack)
        session.beginDialog(args.action, args);
    }
})
// Once triggered, will end the dialog. 
.cancelAction('cancelHelpAction', 'Leaving help mode, returning to normal mode...', {
    matches: /^%cancel$/i
});



var sendToSpecify = function (session, results) {
    // analyse user's request here.
    session.conversationData.prompts.push(results.response)
    console.log(results.response)
    return new Promise(function(resolve, reject) {
        console.log('in promise of sendToSpecify')
        array = session.conversationData.history_states_of_request
        current_request = array[array.length - 1][0]
        api.default.Post('/specify', {'sentence':session.message.text, 'state_of_request':current_request},
        function(response){
            console.log('response of /specify')
            console.log(response.data)
            array.push([response.data.state_of_request, response.data.ready]);
            response.data.sentences.forEach(function(sentence){
                session.send(sentence);
                });
            console.log('after backend /specify response')
            resolve(response.data.ready)
        }, 
        function(error){
            console.log('error backend')
            session.send(ERROR_PROMPT)
            reject('error')
        })
    });
}