var socket;
var socketAddress = window.location.host;
var players={};
function connectSocket() {
  if (socket) {
    console.error('Socket already connected');
    return;
  }

  // Init the socket
  socket = io(socketAddress);
  socket.on('connect', function() {
    console.log('Socket established, id =', socket.id);
    me.id=socket.id;
    update();
  });
  // Listen for events
  socket.on('init', function(data) {
    console.log('Init:', data);
    var ids=data.ids;
    ids.forEach(function(a){
      players[a] = {groupId: cars.addGroup(),id:a};
      players[a].object = players[a].groupId.addSVGFile({x: 0, y: 0, class:"car"}, "Images/Car_1.svg");
      players[a].groupId.scale(0.08, 0.08);
    });
    //players[socket.id].object = cars.addSVGFile({x: me.x, y: me.y, class:"car"});
    svg.insert(document.getElementById("svg-container"), true);

    socket.emit("force",JSON.stringify(me));
  });

  socket.on('new-connection', function(data) {
    console.log('New connection:', data);
    players[data.id]={id:data.id,object:cars.addRect({x: 10, y: 10, width:4, height:4, class:"car"})};
    socket.emit("force",JSON.stringify(me));
  });
  socket.on('update', function(data) {
    //console.log('Incoming move msg:', data);
    var msg=JSON.parse(data);
    for(s in msg){
      players[msg.id][s]=msg[s];
    }
    update();
    //console.log(s);
  });
  socket.on('force', function(data) {
    console.log('Force reset:', data);
    data=JSON.parse(data);
    /*players.forEach(function(a,i){
      if(data.id==a.id){
        players[i]=data;
      }
    });*/
  });
  socket.on('leave', function(data) {
    console.log('Incoming leave msg:', data);
    delete players[data.id];
  });
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
