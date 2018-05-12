import * as WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 10001 });

wss.on('connection', ws => {
    ws.on('message', message => {
        for (let client of wss.clients) {
            if (ws === client) continue;
            console.log(message);
        }
    });
    ws.send(JSON.stringify({ type: 'ok' }));
});
