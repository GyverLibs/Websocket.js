# Websocket.js
Обёртка на JS WebSocket
- Автоматическое переподключение

[demo](https://gyverlibs.github.io/Websocket.js/test/)

> **Browser**: https://gyverlibs.github.io/Websocket.js/Websocket.min.js

> **Node**: npm i @alexgyver/websocket

## Дока
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