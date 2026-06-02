This is an automatic translation and may be incorrect in some places. See the source README and examples for authoritative information.

# Websocket.js
Wrapper on JS WebSocket
- Automatic reconnection

[demo](https://gyverlibs.github.io/Websocket.js/test/)

> **Browser**: https://gyverlibs.github.io/Websocket.js/Websocket.min.js

> **Node**: npm i @alexgyver/websocket

## Doc.
```js
constructor(params = {});
config(params = {});
// ip: "localhost"
// port: 81
// proto: ""
// secure: false
// reconnect: 1000

onbin(b);
ontext(t);

onopen():
onclose():
onchange(s):
onerror(e);

opened();

open();
close();

sendBin(data);
sendText(text);
```
