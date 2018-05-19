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
export const isDirection = (obj: any): obj is Direction => obj === 'left' || obj === 'right';
export interface Position {
    x: number;
    y: number;
}
export const isPosition = (obj: any): obj is Position => {
    if (obj == null || typeof obj !== 'object') return false;
    if (typeof obj.x !== 'number') return false;
    if (typeof obj.y !== 'number') return false;
    return true;
};
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
export const isPlayer = (obj: any): obj is Player => {
    if (obj == null || typeof obj !== 'object') return false;
    if (typeof obj.color !== 'number') return false;
    if (!isDirection(obj.direction)) return false;
    if (!isPosition(obj.position)) return false;
    return true;
};

export interface GameState {
    players: { [key: string]: Player };
}
export const createGameState = (obj: Partial<GameState>): GameState => ({
    players: obj.players || {},
});
export const isGameState = (obj: any): obj is GameState => {
    if (obj == null || typeof obj !== 'object') return false;
    if (!Array.isArray(obj.players)) return false;
    return (obj.players as Array<any>).every(player => isPlayer(player));
};

export function update(gameState: GameState, action: Action | Action[]): GameState {
    if (Array.isArray(action)) {
        let _gameState = gameState;
        for (const a of action) _gameState = update(_gameState, a);
        return _gameState;
    }
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
                        position: action.position,
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
export const isAction = (obj: any): obj is Action => {
    return (
        isInitAction(obj) ||
        isJoinAction(obj) ||
        isLeaveAction(obj) ||
        isMoveAction(obj) ||
        isChangeDirectionAction(obj)
    );
};

export interface InitAction {
    type: 'init';
    gameState: GameState;
}
export const isInitAction = (obj: any): obj is InitAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'init') return false;
    if (!isGameState(obj.gameState)) return false;
    return true;
};

export interface JoinAction {
    type: 'join';
    id: string;
    color: PlayerColor;
}
export const isJoinAction = (obj: any): obj is JoinAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'join') return false;
    if (typeof obj.id !== 'string') return false;
    if (typeof obj.color !== 'number') return false;
    return true;
};

export interface LeaveAction {
    type: 'leave';
    id: string;
}
export const isLeaveAction = (obj: any): obj is LeaveAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'leave') return false;
    if (typeof obj.id !== 'string') return false;
    return true;
};

export interface MoveAction {
    type: 'move';
    id: string;
    position: Position;
}
export const isMoveAction = (obj: any): obj is MoveAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'move') return false;
    if (typeof obj.id !== 'string') return false;
    if (!isPosition(obj.position)) return false;
    return true;
};

export interface ChangeDirectionAction {
    type: 'change-direction';
    id: string;
    direction: Direction;
}
export const isChangeDirectionAction = (obj: any): obj is ChangeDirectionAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'change-direction') return false;
    if (typeof obj.id !== 'string') return false;
    if (!isDirection(obj.direction)) return false;
    return true;
};
