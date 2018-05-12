import 'pixi.js';
import { Graphics, Application, Container } from 'pixi.js';
import {
    GameState,
    Player,
    update,
    createGameState,
    Action,
} from '..';
import { CloseReason } from '../ws';
import { gameServerPort } from '../ports';
import uuid from 'uuid/v4';

async function connect(): Promise<[string, WebSocket]> {
    function tryConnect(id: string): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${ gameServerPort }?id=${ id }`);
            ws.addEventListener('open', () => resolve(ws));
            ws.addEventListener('onclose', e => reject((e as any).code));
        });
    }
    while (true) {
        const id = uuid();
        try {
            return [id, await tryConnect(id)];
        } catch (e) {
            if (e === CloseReason.ALREADY_EXIST) continue;
            throw e;
        }
    }
}

async function main() {
    const app: Application = new Application({ width: 800, height: 600 });
    let gameState: GameState = createGameState({});
    let scene: Graphics;
    const gravity: number = 2;
    let additionalDeltaY: number = 0;
    let jumping: boolean = false;
    const keyPressed: {[key: string]: boolean} = {};
    const [ currentPlayerId, ws ] = await connect();
    console.log(currentPlayerId);
    ws.addEventListener('message', e => {
        const action = JSON.parse(e.data) as Action;
        gameState = update(gameState, action);
    });
    ws.addEventListener('close', e => console.error(e.code, e.reason));
    document.body.appendChild(app.view);
    app.renderer.backgroundColor = 0xeeeeee;
    PIXI.loader.load(() => {
        scene = new Graphics();
        app.stage.addChild(scene);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        app.ticker.add(loop);
    });

    function getCurrentPlayer(): Player | undefined {
        return gameState.players[currentPlayerId];
    }

    function loop(delta: number) {
        handleMove();

        scene.clear();

        for (const player of Object.values(gameState.players)) {
            scene.beginFill(player.color);
            scene.drawRect(player.position.x, player.position.y, 50, 50);
            scene.endFill();
        }
    }

    function updateGameState(action: Action) {
        gameState = update(gameState, action);
        ws.send(JSON.stringify(action));
    }

    function handleMove() {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;

        const speed = 8;
        const floorY = 500;
        const delta = {x: 0, y: 0};

        if (keyPressed['ArrowLeft']) {
            delta.x -= speed;
        }
        if (keyPressed['ArrowRight']) {
            delta.x += speed;
        }
        if (keyPressed['ArrowUp'] && !jumping) {
            additionalDeltaY = -25;
            jumping = true;
        }

        additionalDeltaY += gravity;
        delta.y += additionalDeltaY;

        if (currentPlayer.position.x + delta.x < 0) {
            delta.x = 0 - currentPlayer.position.x;
        }
        else if (currentPlayer.position.x + delta.x > 750) {
            delta.x = 750 - currentPlayer.position.x;
        }
        if (currentPlayer.position.y + delta.y > floorY) {
            delta.y = floorY - currentPlayer.position.y;
            jumping = false;
        }

        if (delta.x || delta.y) {
            updateGameState({
                type: 'move',
                id: currentPlayerId,
                posiiton: {
                    x: currentPlayer.position.x + delta.x,
                    y: currentPlayer.position.y + delta.y,
                },
            });
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        keyPressed[e.key] = true;
    }

    function handleKeyUp(e: KeyboardEvent) {
        keyPressed[e.key] = false;
    }
}

main();
