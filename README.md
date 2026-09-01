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
// path: "/"
// url: undefined
// proto: ""
// secure: false
// reconnect: 1000
// connectTimeout: 5000
// closeTimeout: 2000

onbin(b);
ontext(t);

onopen():
onclose(code, reason, wasClean):
onchange(s):
onerror(e);

opened();

open();
close();

sendBin(data);
sendText(text);
```