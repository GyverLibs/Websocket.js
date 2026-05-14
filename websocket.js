export default class WebSocketJS {
    static State = {
        Closed: 'closed',
        Opening: 'opening',
        Open: 'open',
        Closing: 'closing',
    };

    onbin(b) { }
    ontext(t) { }

    onopen() { }
    onclose() { }
    onchange(s) { }
    onerror(e) { }

    constructor(params = {}) {
        const def = {
            ip: "localhost",
            port: 81,
            proto: undefined,
            secure: false,
            reconnect: 1000,
        };

        this.cfg = { ...def, ...params };
    }

    config(params = {}) {
        this.cfg = { ...this.cfg, ...params };
    }

    opened() {
        return this._state === WebSocketJS.State.Open &&
            this.ws &&
            this.ws.readyState === WebSocket.OPEN;
    }

    open() {
        if (this.cfg.reconnect) this.retry = true;
        this._open();
        return true;
    }

    _open() {
        if (
            this.ws &&
            (
                this.ws.readyState === WebSocket.CONNECTING ||
                this.ws.readyState === WebSocket.OPEN
            )
        ) {
            return false;
        }

        const proto = this.cfg.secure || location.protocol === "https:"
            ? "wss"
            : "ws";

        const url = `${proto}://${this.cfg.ip}:${this.cfg.port}/`;

        this._change(WebSocketJS.State.Opening);

        const socket = this.cfg.proto
            ? new WebSocket(url, this.cfg.proto)
            : new WebSocket(url);

        socket.binaryType = "arraybuffer";
        this.ws = socket;

        let timeout = null;

        if (this.retry) {
            timeout = setTimeout(() => {
                if (socket.readyState === WebSocket.CONNECTING) {
                    socket.close();
                }
            }, this.cfg.reconnect);
        }

        socket.onopen = () => {
            if (this.ws !== socket) return;

            clearTimeout(timeout);
            this._change(WebSocketJS.State.Open);
        };

        socket.onclose = () => {
            clearTimeout(timeout);

            if (this.ws !== socket) return;

            this.ws = null;
            this._change(WebSocketJS.State.Closed);

            if (this.retry) {
                setTimeout(() => {
                    if (this.retry) this._open();
                }, this.cfg.reconnect);
            }
        };

        socket.onmessage = (e) => {
            if (this.ws !== socket) return;

            try {
                if (typeof e.data === "string") this.ontext(e.data);
                else this.onbin(e.data);
            } catch (e) {
                this._error(e);
            }
        };

        socket.onerror = (e) => {
            if (this.ws !== socket) return;
            this._error(e);
        };

        return true;
    }

    close() {
        this.retry = false;

        if (!this.ws) {
            this._change(WebSocketJS.State.Closed);
            return true;
        }

        this._change(WebSocketJS.State.Closing);

        const socket = this.ws;
        this.ws = null;

        try {
            socket.close();
        } catch (e) {
            this._error(e);
        }

        this._change(WebSocketJS.State.Closed);

        return true;
    }

    sendBin(data) {
        return this._send(data);
    }

    sendText(text) {
        return this._send(text);
    }

    _send(data) {
        if (!this.opened()) return false;

        try {
            this.ws.send(data);
            return true;
        } catch (e) {
            this._error(e);
            return false;
        }
    }

    ws = null;
    retry = false;
    _state = WebSocketJS.State.Closed;

    _error(e) {
        this.onerror('[WS] ' + e);
    }

    _change(s) {
        if (this._state === s) return;

        this._state = s;
        this.onchange(s);

        switch (s) {
            case WebSocketJS.State.Open:
                this.onopen();
                break;

            case WebSocketJS.State.Closed:
                this.onclose();
                break;
        }
    }
}