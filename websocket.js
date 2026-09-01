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
            url: undefined,
            ip: "localhost",
            port: 81,
            path: "/",
            proto: undefined,
            secure: false,
            reconnect: 1000,
            connectTimeout: 5000,
            closeTimeout: 2000,
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

    async open() {
        if (this.opened()) return true;
        if (this._openPromise) return this._openPromise;

        if (this._closePromise) {
            await this._closePromise;
            if (this.opened()) return true;
        }

        if (this.cfg.reconnect) this.retry = true;

        const promise = this._connect();
        this._openPromise = promise;
        const result = await promise;
        if (this._openPromise === promise) this._openPromise = null;
        return result;
    }

    _getUrl() {
        if (this.cfg.url) return this.cfg.url;
        const proto = this.cfg.secure || location.protocol === "https:"
            ? "wss"
            : "ws";
        const port = this.cfg.port === undefined || this.cfg.port === null || this.cfg.port === ""
            ? ""
            : `:${this.cfg.port}`;
        const path = this.cfg.path
            ? (this.cfg.path.startsWith("/") ? this.cfg.path : `/${this.cfg.path}`)
            : "/";
        return `${proto}://${this.cfg.ip}${port}${path}`;
    }

    _connect() {
        this._change(WebSocketJS.State.Opening);

        let socket;
        try {
            const url = this._getUrl();
            socket = this.cfg.proto
                ? new WebSocket(url, this.cfg.proto)
                : new WebSocket(url);
        } catch (e) {
            this._error(e);
            this._change(WebSocketJS.State.Closed);
            this._scheduleReconnect();
            return Promise.resolve(false);
        }

        socket.binaryType = "arraybuffer";
        this.ws = socket;

        let resolveOpen;
        let openPending = true;
        const result = new Promise(resolve => resolveOpen = resolve);
        const finishOpen = (value) => {
            if (!openPending) return;
            openPending = false;
            resolveOpen(value);
        };

        const timeout = this.cfg.connectTimeout
            ? setTimeout(() => {
                if (socket.readyState === WebSocket.CONNECTING) {
                    this._error('Open timeout');
                    finishOpen(false);
                    if (this.ws === socket) this.ws = null;
                    try { socket.close(); } catch (e) { }
                    this._change(WebSocketJS.State.Closed);
                    this._finishClose(false);
                    this._scheduleReconnect();
                }
            }, this.cfg.connectTimeout)
            : null;

        socket.onopen = () => {
            if (this.ws !== socket) return;

            clearTimeout(timeout);

            if (this._state === WebSocketJS.State.Closing) {
                socket.close();
                return;
            }

            this._change(WebSocketJS.State.Open);
            finishOpen(true);
        };

        socket.onclose = (e) => {
            clearTimeout(timeout);
            finishOpen(false);

            if (this.ws !== socket) return;

            this.ws = null;
            this._change(WebSocketJS.State.Closed, e.code, e.reason, e.wasClean);
            this._finishClose(true);
            this._scheduleReconnect();
        };

        socket.onmessage = async (e) => {
            if (this.ws !== socket) return;

            try {
                if (typeof e.data === "string") this.ontext(e.data);
                else {
                    let data;
                    if (e.data instanceof ArrayBuffer) data = new Uint8Array(e.data);
                    else if (ArrayBuffer.isView(e.data)) {
                        data = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength);
                    } else if (e.data instanceof Blob) {
                        data = new Uint8Array(await e.data.arrayBuffer());
                        if (this.ws !== socket) return;
                    } else throw new Error('Unsupported binary data');
                    this.onbin(data);
                }
            } catch (e) {
                this._error(e);
            }
        };

        socket.onerror = (e) => {
            if (this.ws !== socket) return;
            this._error(e);
        };

        return result;
    }

    async close() {
        this.retry = false;
        clearTimeout(this._retryTimer);
        this._retryTimer = null;

        if (!this.ws) {
            this._change(WebSocketJS.State.Closed);
            return true;
        }
        if (this._closePromise) return this._closePromise;

        this._change(WebSocketJS.State.Closing);

        const socket = this.ws;
        const promise = new Promise(resolve => this._closeResolve = resolve);
        this._closePromise = promise;
        this._closeTimer = this.cfg.closeTimeout
            ? setTimeout(() => {
                if (this.ws === socket) this.ws = null;
                this._change(WebSocketJS.State.Closed, 1006, 'Close timeout', false);
                this._finishClose(false);
            }, this.cfg.closeTimeout)
            : null;

        try {
            socket.close();
        } catch (e) {
            this._error(e);
            if (this.ws === socket) this.ws = null;
            this._change(WebSocketJS.State.Closed);
            this._finishClose(false);
        }

        return promise;
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
    _openPromise = null;
    _closePromise = null;
    _closeResolve = null;
    _closeTimer = null;
    _retryTimer = null;

    _finishClose(result) {
        if (!this._closeResolve) return;
        clearTimeout(this._closeTimer);
        this._closeTimer = null;
        this._closeResolve(result);
        this._closeResolve = null;
        this._closePromise = null;
    }

    _scheduleReconnect() {
        if (!this.retry || !this.cfg.reconnect || this._retryTimer) return;
        this._retryTimer = setTimeout(() => {
            this._retryTimer = null;
            if (this.retry) this.open();
        }, this.cfg.reconnect);
    }

    _error(e) {
        this.onerror('[WS] ' + (e?.message || e?.type || e));
    }

    _change(s, ...args) {
        if (this._state === s) return;

        this._state = s;
        this.onchange(s);

        switch (s) {
            case WebSocketJS.State.Open:
                this.onopen();
                break;

            case WebSocketJS.State.Closed:
                this.onclose(...args);
                break;
        }
    }
}
