import * as uuid from 'uuid/v4';

export interface GameEntity {
    id: string; // uuid
}
export const createGameEntity = (obj: Partial<GameEntity>): GameEntity => ({
    ...obj,
    id: obj.id || uuid(),
});

export type PlayerColor = number;
export type Position = {x: number, y: number};
export interface Player extends GameEntity {
    color: PlayerColor;
    position: Position;
}
export const createPlayer = (obj: Partial<Player>): Player => ({
    ...createGameEntity(obj),
    color: obj.color || 0,
    position: obj.position || {x: 0, y: 0}
});

export interface GameState {
    players: Player[];
}
export const createGameState = (obj: Partial<GameState>): GameState => ({
    players: obj.players || [],
});

export function update(gameState: GameState, action: Action): GameState {
    switch (action.type) {
        case 'init':
            return action.gameState;
        case 'join':
            return {
                ...gameState,
                players: [...gameState.players, createPlayer({
                    id: action.id,
                    color: action.color,
                })],
            };
        case 'move':
            return {
                ...gameState,
                players: [...gameState.players.filter(player => player.id !== action.id), createPlayer({
                    id: action.id,
                    position: action.posiiton,
                })],
            };
        case 'leave':
            return {
                ...gameState,
                players: gameState.players.filter(player => player.id !== action.id),
            };
    }
}

export const serverOnlyActions: Action['type'][] = [
    'init',
    'join',
    'leave',
];

export const everyActions: Action['type'][] = [
    ...serverOnlyActions,
    'move',
];

export type Action =
    InitAction |
    JoinAction |
    MoveAction |
    LeaveAction;

export interface InitAction {
    type: 'init';
    gameState: GameState;
}

export interface JoinAction {
    type: 'join';
    id: string;
    color: PlayerColor;
}

export interface MoveAction {
    type: 'move';
    id: string;
    posiiton: Position;
}

export interface LeaveAction {
    type: 'leave';
    id: string;
}
