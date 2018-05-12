import * as WebSocket from 'ws';

export function broadcast(
    wss: WebSocket.Server,
    ws: WebSocket,
    message: string,
) {
    for (let client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;
        if (ws === client) continue;
        client.send(message, () => { /* ignore error */ });
    }
}

export class IdConnMap {
    private idConnMap: Map<string, WebSocket>;
    private connIdMap: WeakMap<WebSocket, string>;
    constructor() {
        this.idConnMap = new Map();
        this.connIdMap = new WeakMap();
    }
    hasId(id: string) { return this.idConnMap.has(id); }
    hasConn(conn: WebSocket) { return this.connIdMap.has(conn); }
    set(id: string, conn: WebSocket) {
        this.idConnMap.set(id, conn);
        this.connIdMap.set(conn, id);
    }
    delete(id: string) { this.idConnMap.delete(id); }
    id(conn: WebSocket): string | undefined { return this.connIdMap.get(conn); }
    conn(id: string): WebSocket | undefined { return this.idConnMap.get(id); }
    ids(): Iterable<string> { return this.idConnMap.keys(); }
}
