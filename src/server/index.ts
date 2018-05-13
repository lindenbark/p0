import * as http from 'http';
import * as url from 'url';

import * as WebSocket from 'ws';

import {
    GameState,
    createGameState,
    update,
    everyActions,
    serverOnlyActions,
    Action,
    JoinAction,
    LeaveAction,
} from '../index';
import {
    IdConnMap,
    broadcast,
} from './ws-util';
import { CloseReason } from '../ws';
import {
    gameServerPort,
    gameServerDebugPort,
} from '../ports';

const wss = new WebSocket.Server({ port: gameServerPort });
const idConnMap: IdConnMap = new IdConnMap();
const connRttMap: WeakMap<WebSocket, number> = new WeakMap();
let gameState: GameState = createGameState({});

interface RequestQuery {
    id: string;
}

wss.on('connection', (ws, req) => {
    const requestUrl = url.parse(req.url || '/', true);
    const query = requestUrl.query as Partial<RequestQuery>;
    if (!query.id) return ws.close(CloseReason.ALREADY_EXIST, '해당 id는 이미 접속되어 있습니다.');
    idConnMap.set(query.id, ws);
    const doServerAction = <TAction extends Action>(action: TAction) => {
        gameState = update(gameState, action);
        broadcast(wss, ws, JSON.stringify(action));
    };
    doServerAction<JoinAction>({ type: 'join', id: query.id, color: (Math.random() * 0xffffff) & 0xefefef });
    ws.send(JSON.stringify({ type: 'init', gameState }));
    ws.on('close', () => {
        const id = idConnMap.id(ws);
        if (!id) return;
        idConnMap.delete(id);
        doServerAction<LeaveAction>({ type: 'leave', id });
    });
    ws.on('message', message => {
        if (typeof message !== 'string') return ws.close(CloseReason.INVALID_MESSAGE, '이 서버는 json 문자열만 받습니다.');
        const clientAction = JSON.parse(message) as Action; // TODO: validate
        if (!everyActions.includes(clientAction.type)) return ws.close(CloseReason.UNKNOWN_ACTION, '그런 액션 없습니다.');
        if (serverOnlyActions.includes(clientAction.type)) return ws.close(CloseReason.NOT_ALLOWED_ACTION, '클라이언트는 해당 액션을 수행할 권한이 없습니다.');
        gameState = update(gameState, clientAction);
        broadcast(wss, ws, message);
    });
    { // calc rtt
        let lastPing: number;
        const rtts: number[] = [];
        const ping = () => {
            lastPing = Date.now();
            ws.ping();
        };
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        ping();
        ws.on('pong', () => {
            const pong = Date.now();
            if (rtts.length >= 10) rtts.shift();
            rtts.push(pong - lastPing);
            connRttMap.set(ws, avg(rtts));
            setTimeout(ping, 100);
        });
    }
});

console.log(`게임 서버: ws://localhost:${ gameServerPort }`);

const resMap: { [url: string]: () => object } = {
    '/rtts': () => {
        const result: { [id: string]: number | undefined } = {};
        for (const id of idConnMap.ids()) {
            result[id] = connRttMap.get(idConnMap.conn(id)!);
        }
        return result;
    },
};
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(
        resMap[req.url!] ?
        JSON.stringify(resMap[req.url!](), null, 4) :
        'null',
    );
    res.end();
}).listen(
    gameServerDebugPort,
    '0.0.0.0',
    () => {
        console.log(`디버깅 서버: http://localhost:${ gameServerDebugPort }`);
    },
);
