export default class WebSocketJS {
    //#region handlers
    onbin(b) { }
    ontext(t) { }
    onopen() { }
    onclose() { }
    onerror(e) { }

    //#region constructor
    constructor(ip, port, proto, tout = 1000) {
        this.config(ip, port, proto, tout);
    }
    config(ip, port, proto, tout = 1000) {
        this.ip = ip;
        this.port = port;
        this.proto = proto;
        this.tout = tout;
    }

    //#region methods
    opened() {
        return this.ws && this.ws.readyState == WebSocket.OPEN;
    }
    open() {
        if (this.ws) {
            this.ws.close();
            return;
        }

        this.ws = new WebSocket(`ws://${this.ip}:${this.port}/`, [this.proto]);
        this.ws.binaryType = "arraybuffer";
        this.reconnect = true;

        let lws = this.ws;
        let timeout = setTimeout(() => lws.close(), this.tout);

        this.ws.onopen = () => {
            clearTimeout(timeout);
            this.onopen();
        }

        this.ws.onclose = () => {
            this.ws = null;
            clearTimeout(timeout);
            if (this.reconnect) setTimeout(() => this.open(), this.tout);
            this.onclose();
        }

        this.ws.onmessage = (e) => {
            if (typeof e.data === "string") this.ontext(e.data);
            else this.onbin(e.data);
        }

        this.ws.onerror = (e) => {
            this.onerror(e);
        }
    }
    close() {
        this.reconnect = false;
        if (this.ws) this.ws.close();
    }

    sendBin(data) {
        if (this.opened()) this.ws.send(data);
    }
    sendText(text) {
        if (this.opened()) this.ws.send(text);
    }
}