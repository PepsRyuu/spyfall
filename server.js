const express = require('express');
const Game = require('./game.js');

const app = express();
require('express-ws')(app);

app.ws('/ws', (ws, req) => {
    ws.on('message', function (msg) {
        try {
            msg = JSON.parse(msg);
            Game.handleMessage(ws, msg);
        } catch (e) {
            console.error(e);
        }
    });

    ws.on('close', function () {
        Game.handleDisconnect(ws);
    });

    Game.handleConnection(ws);
});

app.use('/', express.static(__dirname + '/public'));
app.listen(3000);