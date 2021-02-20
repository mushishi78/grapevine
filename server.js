const http = require('http')
const SocketIO = require('socket.io')
const static = require('node-static');
const fs = require('fs')

const fileServer = new static.Server('./static', { cache: null });
const indexHTML = fs.readFileSync(__dirname + '/static/index.html', 'utf8');

const httpServer = http.createServer((request, response) => {
  request.addListener('end', () => fileServer.serve(request, response, err => {
    if (err && err.status === 404) {
      response.setHeader('Content-Type', 'text/html');
      response.setHeader('Content-Length', Buffer.byteLength(indexHTML));
      response.statusCode = 200;
      response.end(indexHTML);
    }
  })).resume();

  request.on('error', err => console.error(err.stack))
});

const io = SocketIO(httpServer);

io.on('connection', socket => {
  console.log('connect');
});

httpServer.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
