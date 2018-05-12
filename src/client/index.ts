import 'pixi.js';
import { Graphics, Application, Container } from 'pixi.js';
import { GameState, Player, update, createGameState, Action } from '..';
import uuid from 'uuid/v4';

const app: Application = new Application({width: 800, height: 600});
let gameState: GameState;
let scene: Graphics;
let currentPlayer: Player;
const keyPressed: {[key: string]: boolean} = {};

document.body.appendChild(app.view);
app.renderer.backgroundColor = 0xeeeeee;
PIXI.loader.load(init);

function fetchGameState() {
    gameState = createGameState({});
}

function init() {
    fetchGameState();

    scene = new Graphics();
    app.stage.addChild(scene);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    currentPlayer = {id: uuid(), color: 0x000000, position: {x: 0, y: 0}};
    updateGameState({type: 'join', id: currentPlayer.id, color: currentPlayer.color});
    app.ticker.add(loop);
}

function loop(delta: number) {
    handleInput();

    scene.clear();

    for (const player of gameState.players) {
        scene.beginFill(player.color);
        scene.drawRect(player.position.x, player.position.y, 50, 50);
        scene.endFill();
    }
}

function updateGameState(action: Action) {
    gameState = update(gameState, action);
}

function handleInput() {
    const speed = 2;
    const delta = {x: 0, y: 0};

    if (keyPressed['ArrowLeft']) {
        delta.x -= speed;
    }
    if (keyPressed['ArrowRight']) {
        delta.x += speed;
    }
    if (keyPressed['ArrowUp']) {
        delta.y -= speed;
    }
    if (keyPressed['ArrowDown']) {
        delta.y += speed;
    }

    currentPlayer.position.x += delta.x;
    currentPlayer.position.y += delta.y;

    updateGameState({type: 'move', id: currentPlayer.id, posiiton: currentPlayer.position})
}

function handleKeyDown(e: KeyboardEvent) {
    keyPressed[e.key] = true;
}

function handleKeyUp(e: KeyboardEvent) {
    keyPressed[e.key] = false;
}