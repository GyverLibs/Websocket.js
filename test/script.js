import WebSocketJS from "https://gyverlibs.github.io/Websocket.js/websocket.min.js";

let i = 0;
let ws = new WebSocketJS();

document.addEventListener("DOMContentLoaded", () => {
    open_b.onclick = () => { ws.config(ip_i.value, 81, 'esp'); ws.open(); }
    close_b.onclick = () => ws.close();
    sendt_b.onclick = () => ws.sendText('Hello ' + i++);
    sendb_b.onclick = () => ws.sendBin(new Uint8Array([i++, i++, i++]));

    // read
    ws.onbin = b => console.log(b);
    ws.ontext = t => console.log(t);

    // state
    ws.onopen = () => console.log('Opened');
    ws.onclose = () => console.log('Closed');
    ws.onerror = e => console.log(e);
});