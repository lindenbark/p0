import 'pixi.js';
import { Graphics, Application, Container } from 'pixi.js';
import { GameState, Player, update, createGameState, Action } from '..';
import uuid from 'uuid/v4';

const app: Application = new Application({width: 800, height: 600});
let gameState: GameState;
let scene: Graphics;


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

    gameState = update(gameState, {type: 'join', id: uuid(), color: 0x000000});
    app.ticker.add(loop);
}

function loop(delta: number) {
    for (const player of gameState.players) {
        scene.beginFill(player.color);
        scene.drawRect(player.position.x, player.position.y, 50, 50);
        scene.endFill();
    }
}

function handleKeyDown(e: KeyboardEvent) {
    
}

function handleKeyUp(e: KeyboardEvent) {

}