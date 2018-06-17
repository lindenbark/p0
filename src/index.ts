import * as uuid from 'uuid/v4';
import { Rect, intersectRect } from './model/geom/rectangle';

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
export type AnimationState = 'idle' | 'move' | 'attack' | 'hit' | 'die';
export const isAnimationState = (obj: any): obj is AnimationState => {
    return (
        obj === 'idle' ||
        obj === 'move' ||
        obj === 'attack' ||
        obj === 'hit' ||
        obj === 'die'
    );
}
export interface Player extends GameEntity {
    color: PlayerColor;
    direction: Direction;
    position: Position;
    animationState: AnimationState;
}
export const createPlayer = (obj: Partial<Player>): Player => ({
    ...createGameEntity(obj),
    color: obj.color || 0,
    direction: obj.direction || 'right',
    position: obj.position || {x: 0, y: 0},
    animationState: 'idle',
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

export function update(
    gameState: GameState,
    action: Action | Action[],
    hook?: (action: Action) => void,
): GameState {
    if (Array.isArray(action)) {
        let _gameState = gameState;
        for (const a of action) _gameState = update(_gameState, a, hook);
        return _gameState;
    }
    hook && hook(action);
    switch (action.type) {
        case 'id': return gameState;
        case 'init': return action.gameState;
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
        case 'attack':
            return {
                ...gameState,
                players: {
                    ...gameState.players,
                    [ action.id ]: createPlayer({
                        ...gameState.players[action.id],
                        animationState: 'attack',
                    })
                }
            };
        case 'hit':
            return {
                ...gameState,
                players: {
                    ...gameState.players,
                    [ action.id ]: createPlayer({
                        ...gameState.players[action.id],
                        animationState: 'hit',
                    })
                }
            };
        case 'die':
            return {
                ...gameState,
                players: {
                    ...gameState.players,
                    [ action.id ]: createPlayer({
                        ...gameState.players[action.id],
                        animationState: 'die',
                    })
                }
            };
    }
}

export function testHit(gameState: GameState, attackerId: string): string | null {
    const attacker = gameState.players[attackerId];

    const attackRect: Rect = {
        x: attacker.position.x + (attacker.direction === 'left' ? -50 : 50),
        y: attacker.position.y,
        width: 50,
        height: 50
    }

    for (const otherPlayer of Object.values(gameState.players)) {
        if (otherPlayer.id === attackerId) continue;

        const otherPlayerRect: Rect = {
            ...otherPlayer.position,
            width: 50,
            height: 50,
        }
        if (intersectRect(attackRect, otherPlayerRect)) {
            return otherPlayer.id;
        }
    }
    return null;
}

export const serverOnlyActions: Action['type'][] = [
    'id',
    'init',
    'join',
    'leave',
    'hit',
    'die',
];

export const everyActions: Action['type'][] = [
    ...serverOnlyActions,
    'move',
    'change-direction',
    'attack',
];

export type Action =
    IdAction |
    InitAction |
    JoinAction |
    LeaveAction |
    MoveAction |
    ChangeDirectionAction |
    AttackAction |
    HitAction |
    DieAction;
export const isAction = (obj: any): obj is Action => {
    return (
        isIdAction(obj) ||
        isInitAction(obj) ||
        isJoinAction(obj) ||
        isLeaveAction(obj) ||
        isMoveAction(obj) ||
        isChangeDirectionAction(obj) ||
        isAttackAction(obj) ||
        isHitAction(obj) ||
        isDieAction(obj)
    );
};

export interface IdAction {
    type: 'id';
    id: string;
}
export const isIdAction = (obj: any): obj is IdAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'id') return false;
    if (typeof obj.id !== 'string') return false;
    return true;
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

export interface AttackAction {
    type: 'attack';
    id: string;
}
export const isAttackAction = (obj: any): obj is AttackAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'attack') return false;
    if (typeof obj.id !== 'string') return false;
    return true;
};

export interface HitAction {
    type: 'hit';
    id: string;
}
export const isHitAction = (obj: any): obj is HitAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'hit') return false;
    if (typeof obj.id !== 'string') return false;
    return true;
};

export interface DieAction {
    type: 'die';
    id: string;
}
export const isDieAction = (obj: any): obj is DieAction => {
    if (obj == null || typeof obj !== 'object') return false;
    if (obj.type !== 'die') return false;
    if (typeof obj.id !== 'string') return false;
    return true;
};
