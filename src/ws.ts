// https://www.iana.org/assignments/websocket/websocket.xml#close-code-number
export enum CloseReason {
    ALREADY_EXIST = 4000,
    INVALID_MESSAGE,
    NOT_ALLOWED_ACTION,
    UNKNOWN_ACTION,
}
