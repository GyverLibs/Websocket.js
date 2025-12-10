export default class WebSocketJS {
    //#region handlers
    onbin(b) { }
    ontext(t) { }

    onopen() { }
    onclose() { }
    onchange(s) { }
    onerror(e) { }

    //#region constructor
    constructor(params = {}) {
        const def = {
            ip: "localhost",
            port: 81,
            proto: "",
            secure: false,
            reconnect: 1000,
        };
        this.cfg = { ...def, ...params };
        this.ws = null;
        this.retry = false;
    }

    config(params = {}) {
        this.cfg = { ...this.cfg, ...params };
    }

    //#region methods
    opened() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    open() {
        if (this.cfg.reconnect) this.retry = true;
        this._open();
    }
    _open() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) return;

        let proto = this.cfg.secure || location.protocol === "https:" ? "wss" : "ws";
        this.ws = new WebSocket(`${proto}://${this.cfg.ip}:${this.cfg.port}/`, [this.cfg.proto]);
        this.ws.binaryType = "arraybuffer";

        const socket = this.ws;
        let timeout = null;

        if (this.retry) timeout = setTimeout(() => {
            if (socket.readyState === WebSocket.CONNECTING) socket.close();
        }, this.cfg.reconnect);

        socket.onopen = () => {
            clearTimeout(timeout);
            this._change(true);
        };

        socket.onclose = () => {
            clearTimeout(timeout);

            if (this.ws === socket) this.ws = null;

            this._change(false);

            if (this.retry) {
                setTimeout(() => this._open(), this.cfg.reconnect);
            }
        };

        socket.onmessage = (e) => {
            if (typeof e.data === "string") this.ontext(e.data);
            else this.onbin(e.data);
        };

        socket.onerror = (e) => {
            this.onerror('[WS] Error');
        };
    }

    close() {
        this.retry = false;

        if (this.ws) {
            const socket = this.ws;
            this.ws = null;
            socket.close();
        }
    }

    sendBin(data) {
        if (this.opened()) this.ws.send(data);
    }

    sendText(text) {
        if (this.opened()) this.ws.send(text);
    }

    //#region private
    _change(s) {
        this.onchange(s);
        s ? this.onopen() : this.onclose();
    }
}