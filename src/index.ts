import * as uuid from 'uuid/v4';

export interface GameEntity {
    id: string; // uuid
}
export const createGameEntity = (obj: Partial<GameEntity>): GameEntity => ({
    ...obj,
    id: obj.id || uuid(),
});

export type PlayerColor = number;
export type Direction = 'left' | 'right';
export interface Position {
    x: number;
    y: number;
}
export interface Player extends GameEntity {
    color: PlayerColor;
    direction: Direction;
    position: Position;
}
export const createPlayer = (obj: Partial<Player>): Player => ({
    ...createGameEntity(obj),
    color: obj.color || 0,
    direction: obj.direction || 'right',
    position: obj.position || {x: 0, y: 0},
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
        case 'leave': {
            const players = { ...gameState.players };
            delete players[action.id];
            return { ...gameState, players };
        }
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
        case 'change-direction':
            return {
                ...gameState,
                players: {
                    ...gameState.players,
                    [ action.id ]: createPlayer({
                        ...gameState.players[action.id],
                        direction: action.direction,
                    }),
                },
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
    'change-direction',
];

export type Action =
    InitAction |
    JoinAction |
    LeaveAction |
    MoveAction |
    ChangeDirectionAction;

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

export interface ChangeDirectionAction {
    type: 'change-direction';
    id: string;
    direction: Direction;
}

export interface LeaveAction {
    type: 'leave';
    id: string;
}
