# Tips about the MS Bot Framework

The following tips come from my experience coding the [bot](./app.js).

## About dialogs

The main difficulty, in my opinion, is to understand how dialogs are stacked, and what happens when one executes 'session.beginDialog()' or 'session.endDialog()'. This point is not very well explained in the official MS documentation, in my opinion. 

For instance, the following difficulty arises : line 62, there is a text prompt. If another dialog begins due to a beginDialogAction or a triggerAction, the text prompt (which is a dialog in itself) will be interrupted. When the inner dialog ends, the text prompt will resume, but send an error message to the user. I solved this behaviour by adding a retryPrompt to the text prompt definition, which is printed to the user in such a case.

Another weird behaviour that I noticed empirically is that a dialog which is begun explicitely in the code (either via a beginDialogAction or a session.beginDialog() instruction) has to be ended explicitely, either by a session.endDialog() or a session.replaceDialog(). If not, it may loop forever.

Moreover, the behaviour of session.endDialog() being unclear in my opinion (as far as we don't exactly know what the parent dialog does when the child dialog is ended that way), I prefered to use session.replaceDialog(myDialog) whenever possible; the behaviour of the latter is much clearer: it ends the current dialog, and begins a new dialog myDialog properly. The minor drawback is that the dialog stack is not cleared. Thus the dialogs tend to accumulate on the dialog stack (but it's not a big deal since in the end the user will close the conversation, thus ending all pending dialogs, and besides it's unlikely that the conversation will last long).

## Asynchronicity

First, dialogs are asynchronous. Thus the following code cannot work :

```javascript
bot.dialog('myDialog', function (session, args, next) {
    do_something()
    session.beginDialog('anotherDialog');
    do_something_else()
    session.endDialog()
});

bot.dialog('anotherDialog', function (session, args, next) {
    do_another_thing()
    session.endDialog()
});
```

Because the session.endDialog() can be reached at any time, and thus the behaviour of the bot is unpredictable. Especially, it may try to close the parent of myDialog, instead of myDialog.

A correct code snippet is the following:

```javascript
bot.dialog('myDialog', [function (session, args, next) {
    do_something()
    next()
}, function (session, args, next){
    session.beginDialog('reviewRequest');
}, function(session, args){
    do_something_else()
}]);

bot.dialog('anotherDialog', function (session, args, next) {
    do_another_thing()
    session.endDialog()
});
```

A real-life example of this phenomena can be found in the backDialog in app.js.

Second, making dialogs and asynchronous functions work together came as a major difficulty to me, probably due to my lack of profound understanding of promises, and .then() functions. Thus what follows may seem obvious to the reader knowledgeable about Promises. The solution I found and implemented a few times in app.js (for example in the explore and the requestSent dialog) is the following. 

The (main) function inside a dialog returns a Promise. This Promise does an asynchronous call (here to an API) which in itself is a Promise. In the callbacks to this call, the dialog manipulations are made. These manipulations can be for instance: replacing the dialog, ending the dialog, calling a next() function, if inside of a waterfall. 

Said in a different way, I chained several Promises and .then() calls. Obviously, all but the last Promise need to be fulfilled in order to move forward in the chain. The last promise can be left unfulfilled, but it looked cleaner to fulfill it as well (that's the idea of the resolve() on line 169).

## To be completed ?

That's all the tips I've thought of for now. If the reader finds something unclear in the code, he's more than welcome to contact me, and I will update this little guide.