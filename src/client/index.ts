import 'pixi.js';
import {
    Graphics,
    Application,
    Text,
} from 'pixi.js';
import uuid from 'uuid/v4';

import {
    GameState,
    Player,
    update,
    createGameState,
    Action,
    getAttackRect,
} from '..';
import { gameServerPort } from '../ports';
import { Rect } from '../model/geom/rectangle';

type Effect = 
    RectFadeOutEffect;

type RectFadeOutEffect = {
    type: 'rectFadeOut',
    lifetimeCounter: TimeCounter,
    rect: Rect,
    color: number,
}

abstract class TimeCounter {
    constructor(public origin: number, public current: number) {
    }

    abstract update(timeDelta: number): void;
    abstract get completed(): boolean;
    abstract reset(): void;
}

class MinusTimeCounter extends TimeCounter{
    constructor(origin:number, current?: number) {
        super(origin, current || origin);
    }

    update(timeDelta: number) {
        this.current -= timeDelta;
    }

    get completed() {
        return this.current < 0;
    }

    reset() {
        this.current = this.origin;
    }
}

function connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${ location.hostname }:${ gameServerPort }?loginToken=${ uuid() }`);
        ws.addEventListener('open', () => resolve(ws));
        ws.addEventListener('onclose', e => reject((e as any).code));
    });
}

async function main() {
    const view = document.getElementById('app') as HTMLCanvasElement;
    const debugTextElement = document.getElementById('debug-text')!;
    const app: Application = new Application({
        width: 650,
        height: 600,
        view,
    });
    const playerSize: number = 50;
    let gameState: GameState = createGameState({});
    let scene: Graphics;
    const gravity: number = 70;
    let additionalDeltaY: number = 0;
    let jumping: boolean = false;
    const keyPressed: { [key: string]: boolean } = {};
    const ws = await connect();
    let currentPlayerId: string | null = null;
    let dead: boolean = false;
    const deadText: Text = new Text("You are dead. Press [R] to restart.", { fontFamily: "NeoDunggeunmo", fill: 0xffffff, fontSize: 24 });
    let effects: Effect[] = [];
    const attackCooltime: MinusTimeCounter = new MinusTimeCounter(0.5, 0);

    deadText.x = (app.screen.width - deadText.width) / 2;
    deadText.y = (app.screen.height - deadText.height) / 2;

    ws.addEventListener('message', e => {
        const action = JSON.parse(e.data) as (Action | Action[]);
        gameState = update(gameState, action, action => {
            if (action.type === 'id') {
                currentPlayerId = action.id;
            }
            if (action.type === "hit") {
                console.log('hit : ', action.id);
            }
            if (action.type === "die") {
                if (currentPlayerId == action.id) {
                    dead = true;
                    scene.addChild(deadText);
                }
            }
            if (action.type === 'attack') {
                setTimeout(() => effects.push({
                    type: 'rectFadeOut',
                    lifetimeCounter: new MinusTimeCounter(0.5),
                    rect: getAttackRect(gameState.players[action.id]),
                    color: 0xff0000
                }), 200);
            }
        });
    });
    ws.addEventListener('close', e => console.error(e.code, e.reason));
    app.renderer.backgroundColor = 0xeeeeee;
    PIXI.loader.load(() => {
        scene = new Graphics();
        app.stage.addChild(scene);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        app.ticker.add(loop);
    });

    function getCurrentPlayer(): Player | null {
        return currentPlayerId ? gameState.players[currentPlayerId] : null;
    }

    function loop() {
        const timeDelta = 1 / app.ticker.FPS;
        const actions: Action[] = [];
        const updateGameState = (action: Action) => {
            gameState = update(gameState, action);
            actions.push(action);
        };
        const currentPlayer = getCurrentPlayer();
        if (!dead && currentPlayer) handlePlayerUpdate(updateGameState, currentPlayer, timeDelta);
        if (actions.length) ws.send(JSON.stringify(actions));
        scene.clear();
        for (const player of Object.values(gameState.players)) {
            scene.beginFill(player.color);
            scene.drawRect(player.position.x, player.position.y, playerSize, playerSize);
            scene.endFill();
        }
        for (const effect of effects) {
            if (effect.type === 'rectFadeOut') {
                scene.beginFill(effect.color, 0.5 * (effect.lifetimeCounter.current / effect.lifetimeCounter.origin));
                scene.drawRect(effect.rect.x, effect.rect.y, effect.rect.width, effect.rect.height);
                scene.endFill();
            }

            effect.lifetimeCounter.update(timeDelta);
        }

        effects = effects.filter(effect => !effect.lifetimeCounter.completed);

        if (dead) {
            scene.beginFill(0, 0.5);
            scene.drawRect(0, 0, app.screen.width, app.screen.height);
            scene.endFill();
            if (keyPressed['KeyR']) {
                // HACK
                location.reload();
            }
        }
        debugTextElement.innerText = currentPlayer ? [
            `fps: ${ app.ticker.FPS }`,
            `direction: ${ currentPlayer.direction }`,
            `x: ${ currentPlayer.position.x }`,
            `y: ${ currentPlayer.position.y }`,
        ].join('\n') : '';
    }

    function handlePlayerUpdate(
        updateGameState: (action: Action) => void,
        currentPlayer: Player,
        timeDelta: number,
    ) {
        if (!currentPlayer) return;

        const speed = 500 * timeDelta;
        const floorY = app.screen.height - playerSize * 2;
        const delta = { x: 0, y: 0 };

        attackCooltime.update(timeDelta);

        if (keyPressed['ArrowLeft']) {
            delta.x -= speed;
        }
        if (keyPressed['ArrowRight']) {
            delta.x += speed;
        }
        if (keyPressed['ArrowUp'] && !jumping) {
            additionalDeltaY = -20;
            jumping = true;
        }
        if (attackCooltime.completed && keyPressed['KeyX']) {
            updateGameState({
                type: 'attack',
                id: currentPlayerId!,
            });

            setTimeout(() => effects.push({
                type: 'rectFadeOut',
                lifetimeCounter: new MinusTimeCounter(0.5),
                rect: getAttackRect(gameState.players[currentPlayerId!]),
                color: 0xff0000
            }), 200);

            attackCooltime.reset();
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
                id: currentPlayerId!,
                position: {
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
                id: currentPlayerId!,
                direction,
            });
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        keyPressed[e.code] = true;
    }

    function handleKeyUp(e: KeyboardEvent) {
        keyPressed[e.code] = false;
    }
}

main();
