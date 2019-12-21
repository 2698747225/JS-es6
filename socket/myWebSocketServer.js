// 导入websocket模块
const WebSocket = require('ws');
let i = 1;

// 引用Server类
const WebSocketServer = WebSocket.Server;

// 实例化
const myWs = new WebSocketServer({
  port: 8080
});

// 遍历分发
function boardCost (obj) {
  myWs.clients.forEach((conn) => {
    conn.send(JSON.stringify(obj));
  })
}

myWs.on('connection', ws => {
  ws.on('message', message => {
    // 接受消息群发
    try {
      const msg = JSON.parse(message);
      console.log(msg);
      boardCost(msg);
    } catch (e) { }
  })

  // setInterval(() => {
  //   ws.send('hello connection success!!!' + i);
  //   i++;
  // }, 1000);
});