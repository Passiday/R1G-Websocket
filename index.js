var express = require('express');
var socket = require('socket.io');

var port = 1234;

// App setuo
var app = express();
var server = app.listen(port, function() {
  console.log('Express server listening on port', port);
});

// Static files
app.use(express.static('static'));

// Socket setup
var io = socket(server);
io.on('connection', function(socket) {
  console.log('Connection established, id=', socket.id);
  console.log('Connection data', socket.handshake.query);

  var initData = socket.handshake.query.initData ? JSON.parse(socket.handshake.query.initData) : null;
  state.clientJoin(socket.id, initData);

  // Inform the freshly connected socket about the currently connected sockets and their shared data
  var connectedSockets = io.sockets.sockets;
  var socketIds = [];
  for (var s in connectedSockets) {
    socketIds.push(s);
  }
  /*
  for (var socketId in connectionData) {
    if (!socketIds.includes(socketId)) delete connectionData[socketId]; 
  }
  */
  socket.emit('init', {ids:socketIds, data:state.publicDataFull()});

  // Inform all other connected sockets about the new connection
  socket.broadcast.emit('new-connection', state.publicDataClient(socket.id));

  // Establish the message event listeners

  socket.on('msg', function(data) {
    console.log('Incoming data on socket', socket.id, ':', data);
    if (data.recipient == 'All') {
      // Emit on all open sockets
      //io.sockets.emit('msg', data); // Send to every open socket, including the sender
      socket.broadcast.emit('msg', data); // Send to every open socket, excluding the sender
    } else {
      // Emit on the specific socket
      data.note = 'This only received by me';
      socket.broadcast.to(data.recipient).emit('msg', data);
    }
  });

  socket.on('move', function(data) {
    console.log('Move event from', socket.id, ':', data);
    state.clientUpdate(socket.id, data);
    socket.broadcast.emit('move', data); // Send to every open socket, excluding the sender
  });

  socket.on('disconnect', function(reason) {
    console.log('Disconnect from', socket.id, '; reason =', reason);
    state.clientLeave(socket.id, reason);
    socket.broadcast.emit('leave', {id: socket.id}); // Send to every open socket, excluding the sender
  });
});

class RoomState {
  constructor() {
    this.clients = {};
  }
  publicDataFull() {
    // Data that describe the current state and can be shared publicly
    return this.clients;
  }
  publicDataClient(clientId) {
    // Data that describe a particular client and can be shared publicly
    return {
      id  : clientId,
      data: this.clients[clientId]
    }
  }
  clientJoin(id, data) {
    this.clients[id] = data;
  }
  clientUpdate(id, data) {
    if (id in this.clients) {
      let client = this.clients[id];
      client.x = data.x;
      client.y = data.y;
    }
  }
  clientLeave(id, reason) {
    delete this.clients[id];
  }
}

var state = new RoomState();