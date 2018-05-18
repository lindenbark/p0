import 'pixi.js';
import {
    Graphics,
    Application,
} from 'pixi.js';
import uuid from 'uuid/v4';

import {
    GameState,
    Player,
    update,
    createGameState,
    Action,
} from '..';
import { CloseReason } from '../ws';
import { gameServerPort } from '../ports';

async function connect(): Promise<[string, WebSocket]> {
    function tryConnect(id: string): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://${ location.hostname }:${ gameServerPort }?id=${ id }`);
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
    const app: Application = new Application({ width: 650, height: 600 });
    const playerSize: number = 50;
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

    function loop(timeDelta: number) {
        handleMove(timeDelta);

        scene.clear();

        for (const player of Object.values(gameState.players)) {
            scene.beginFill(player.color);
            scene.drawRect(player.position.x, player.position.y, playerSize, playerSize);
            scene.endFill();
        }
    }

    function updateGameState(action: Action) {
        gameState = update(gameState, action);
        ws.send(JSON.stringify(action));
    }

    function handleMove(timeDelta: number) {
        const currentPlayer = getCurrentPlayer();
        if (!currentPlayer) return;

        const speed = 8 * timeDelta;
        const floorY = app.screen.height - playerSize * 2;
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

        additionalDeltaY += gravity * timeDelta;
        delta.y += additionalDeltaY;

        const leftWallX = 0;
        const rightWallX = app.screen.width - playerSize;

        if (currentPlayer.position.x + delta.x < leftWallX) {
            delta.x = leftWallX - currentPlayer.position.x;
        }
        else if (currentPlayer.position.x + delta.x > rightWallX) {
            delta.x = rightWallX - currentPlayer.position.x;
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
        changeDirection: if (delta.x !== 0) {
            const direction = (delta.x > 0) ? 'right' : 'left';
            if (currentPlayer.direction === direction) break changeDirection;
            updateGameState({
                type: 'change-direction',
                id: currentPlayerId,
                direction,
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
console.log('hello, travis!');
