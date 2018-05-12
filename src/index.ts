import * as uuid from 'uuid/v4';

export interface GameEntity {
    id: string; // uuid
}
export const createGameEntity = (obj: Partial<GameEntity>): GameEntity => ({
    ...obj,
    id: obj.id || uuid(),
});

export type PlayerColor = number;
export interface Player extends GameEntity {
    color: PlayerColor;
}
export const createPlayer = (obj: Partial<Player>): Player => ({
    ...createGameEntity(obj),
    color: obj.color || 0,
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
];

export type Action =
    InitAction |
    JoinAction |
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

export interface LeaveAction {
    type: 'leave';
    id: string;
}
