import * as http from 'http';
import * as url from 'url';

import * as WebSocket from 'ws';

import {
    GameState,
    createGameState,
    update,
    everyActions,
    serverOnlyActions,
    isAction,
    Action,
    JoinAction,
    LeaveAction,
    testHit,
    HitAction,
    DieAction,
} from '../index';
import {
    IdConnMap,
    ShortIdPool,
    broadcast,
} from './ws-util';
import { CloseReason } from '../ws';
import {
    gameServerPort,
    gameServerDebugPort,
} from '../ports';

const wss = new WebSocket.Server({ port: gameServerPort });
const shortIdPool: ShortIdPool = new ShortIdPool();
const idConnMap: IdConnMap = new IdConnMap();
const connRttMap: WeakMap<WebSocket, number> = new WeakMap();
let gameState: GameState = createGameState({});

interface RequestQuery {
    loginToken: string;
}

wss.on('connection', (ws, req) => {
    const requestUrl = url.parse(req.url || '/', true);
    const query = requestUrl.query as Partial<RequestQuery>;
    console.log(query.loginToken); // TODO: 로그인 검증 및 사용자 정보 얻어내기
    const id = shortIdPool.get();
    idConnMap.set(id, ws);
    const doServerAction = <TAction extends Action>(action: TAction) => {
        gameState = update(gameState, action);
        broadcast(wss, ws, JSON.stringify(action));
    };
    doServerAction<JoinAction>({ type: 'join', id, color: (Math.random() * 0xffffff) & 0xefefef });
    ws.send(JSON.stringify([
        { type: 'id', id },
        { type: 'init', gameState },
    ]), noop);
    ws.on('close', () => {
        const id = idConnMap.id(ws);
        if (!id) return;
        shortIdPool.release(id);
        idConnMap.delete(id);
        doServerAction<LeaveAction>({ type: 'leave', id });
    });
    ws.on('message', message => {
        if (typeof message !== 'string') return ws.close(CloseReason.INVALID_MESSAGE, '이 서버는 json 문자열만 받습니다.');
        const parsed = JSON.parse(message);
        const actions = Array.isArray(parsed) ? parsed : [parsed];
        for (const action of actions) { // validation
            if (action == null || typeof action !== 'object') return ws.close(CloseReason.UNKNOWN_ACTION, '그런 액션 없습니다.');
            if (!everyActions.includes(action.type)) return ws.close(CloseReason.UNKNOWN_ACTION, '그런 액션 없습니다.');
            if (serverOnlyActions.includes(action.type)) return ws.close(CloseReason.NOT_ALLOWED_ACTION, '클라이언트는 해당 액션을 수행할 권한이 없습니다.');
            if (!isAction(action)) return ws.close(CloseReason.UNKNOWN_ACTION, '그런 액션 없습니다.');
        }
        gameState = update(gameState, actions, action => {
            switch (action.type) {
                case 'attack':
                    setTimeout(() => {
                        const playerHit = testHit(gameState, action.id);

                        if (playerHit != null) {
                            playerHit && doServerAction<HitAction>({ type: 'hit', id: playerHit });

                            // 한 대 맞으면 죽는다
                            doServerAction<DieAction>({ type: 'die', id: playerHit });
                        }
                    }, 500);
            }
        });
        broadcast(wss, ws, message);
    });
    { // calc rtt
        let lastPing: number;
        const rtts: number[] = [];
        const ping = () => {
            lastPing = Date.now();
            ws.ping('', false, noop);
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

function noop() {}
