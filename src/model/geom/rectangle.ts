export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function intersectRect(a: Rect, b: Rect) {
    return !(a.x + a.width < b.x || a.y + a.height < b.y || b.x + b.width < a.x || b.y + b.height < a.y);
}