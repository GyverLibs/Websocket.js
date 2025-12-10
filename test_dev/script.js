import WebSocketJS from "../websocket";

let i = 0;
let ws = new WebSocketJS({ port: 81, proto: 'esp' });

open_b.onclick = () => { ws.config({ ip: ip_i.value }); ws.open(); }
close_b.onclick = () => ws.close();
sendt_b.onclick = () => ws.sendText('Hello ' + i++);
sendb_b.onclick = () => ws.sendBin(new Uint8Array([i++, i++, i++]));

// read
ws.onbin = b => console.log(b);
ws.ontext = t => console.log(t);

// state
// ws.onopen = () => console.log('Opened');
// ws.onclose = () => console.log('Closed');
ws.onchange = e => console.log(e);
ws.onerror = e => console.log(e);