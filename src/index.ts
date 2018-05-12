import * as uuid from 'uuid/v4';

export interface GameEntity {
    id: string; // uuid
}
const createGameEntity = (obj: Partial<GameEntity>): GameEntity => ({
    ...obj,
    id: obj.id || uuid(),
});

export interface Player extends GameEntity {
    color: string;
}
const createPlayer = (obj: Partial<Player>): Player => ({
    ...createGameEntity(obj),
    color: obj.color || '#000',
});

export interface GameState {
    players: Player[];
}

export function update(gameState: GameState, action: Action): GameState {
    switch (action.type) {
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

export type Action =
    JoinAction |
    LeaveAction;

export interface JoinAction {
    type: 'join';
    id: string;
    color: string;
}

export interface LeaveAction {
    type: 'leave';
    id: string;
}
