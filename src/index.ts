import * as uuid from 'uuid/v4';

export interface GameEntity {
    id: string; // uuid
}
export const createGameEntity = (obj: Partial<GameEntity>): GameEntity => ({
    ...obj,
    id: obj.id || uuid(),
});

export type PlayerColor = number;
export interface Position {
    x: number;
    y: number;
}
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
    players: { [key: string]: Player };
}
export const createGameState = (obj: Partial<GameState>): GameState => ({
    players: obj.players || {},
});

export function update(gameState: GameState, action: Action): GameState {
    switch (action.type) {
        case 'init':
            return action.gameState;
        case 'join':
            return {
                ...gameState,
                players: {
                    ...gameState.players,
                    [ action.id ]: createPlayer({
                        id: action.id,
                        color: action.color,
                    }),
                },
            };
        case 'move':
            return {
                ...gameState,
                players: {
                    ...gameState.players,
                    [ action.id ]: createPlayer({
                        ...gameState.players[action.id],
                        position: action.posiiton,
                    }),
                },
            };
        case 'leave': {
            const players = { ...gameState.players };
            delete players[action.id];
            return { ...gameState, players };
        }
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
