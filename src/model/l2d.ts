// L2d 좌표계: x+: right, y+: down

type Millisecond = number;
type Degree = number;
type Pixel = number;
type Count = number;
type Url = string;

export interface L2d {
    version: 'p0';
    states: L2dState[];
}

export interface L2dState {
    name: string;
    length: Millisecond; // 애니메이션 재생 길이
    playType: L2dStatePlayType; // 재생 형식: 반복할 것인지?
    layers: L2dStateLayer[];
}

export type L2dStatePlayType = L2dStatePlayTypeClamp;

interface L2dStatePlayTypeBase<T> { type: T; }
export interface L2dStatePlayTypeClamp extends L2dStatePlayTypeBase<'clamp'> {
    loop?: Count; // default: no loop
}

export interface L2dStateLayerKey<T> {
    t: Millisecond;
    v: T;
}
export interface L2dStateInterpolatableKey<T> extends L2dStateLayerKey<T> {
    i?: 'nearest' | 'linear'; // quadratic bezier, cubic bezier, catmull rom, etc...
}
export type L2dStateLayer = L2dStateLayerSprite;

interface L2dStateLayerBase<T> { type: T; }
export interface L2dStateLayerSprite extends L2dStateLayerBase<'sprite'> {
    sprite: L2dStateLayerKey<L2dStateLayerSpriteKey>[];
    x?: L2dStateInterpolatableKey<Pixel>[];
    y?: L2dStateInterpolatableKey<Pixel>[];
    skewX?: L2dStateInterpolatableKey<number>[];
    skewY?: L2dStateInterpolatableKey<number>[];
    scaleX?: L2dStateInterpolatableKey<number>[];
    scaleY?: L2dStateInterpolatableKey<number>[];
    rotation?: L2dStateInterpolatableKey<Degree>[];
}

export interface L2dStateLayerSpriteKey {
    l: Url;
    x: Pixel;
    y: Pixel;
    w: Pixel;
    h: Pixel;
}

export interface L2dStateLayerAabb extends L2dStateLayerBase<'aabb'> {
    aabb: L2dStateLayerKey<L2dStateLayerAabbKey>[];
}

export interface L2dStateLayerAabbKey {
    x: Pixel;
    y: Pixel;
    w: Pixel;
    h: Pixel;
}
