// https://www.iana.org/assignments/websocket/websocket.xml#close-code-number
export enum CloseReason {
    INVALID_MESSAGE = 4000,
    NOT_ALLOWED_ACTION,
    UNKNOWN_ACTION,
}
