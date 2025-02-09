// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 5495;
var fs = require ('fs');

var Flogger = fs.createWriteStream('/home/scooter/homegirl/Apps/ziptoad/log.txt', {
	flags: 'a'
});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
	zipcode: socket.zipcode,
      message: data
    });
	Flogger.write(socket.username + " " + socket.zipcode + ": " + data + "\n");
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers,
	zipcode: socket.zipcode

    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
	zipcode: socket.zipcode
    });
  });

	socket.on('add zipcode', function (zipcode) {
		socket.zipcode = zipcode;
	});

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });


	socket.on('heartbeat', function () {
		socket.broadcast.emit('heartbeat', {
		date: new Date()
		});
	 });


	socket.on('add zip', function () {
		socket.zipcode = zipcode;
	});
  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
	zipcode: socket.zipcode
      });
    }
  });
});
