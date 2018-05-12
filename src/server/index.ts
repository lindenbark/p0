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

const port = 10001;
const wss = new WebSocket.Server({ port });
const idConnMap: IdConnMap = new IdConnMap();
let gameState: GameState = createGameState({});

interface RequestQuery {
    id: string;
}

enum CloseReason {
    ALREADY_EXIST,
    INVALID_MESSAGE,
    NOT_ALLOWED_ACTION,
    UNKNOWN_ACTION,
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
    doServerAction<JoinAction>({ type: 'join', id: query.id, color: (Math.random() * 0xffffff) | 0 });
    ws.send(JSON.stringify(gameState));
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
});

console.log(`서버 시작됐습니다: ws://localhost:${ port }`);
