var express = require('express');
var http = require('http');
var path = require('path');
var serverIndex = require('serve-index');
var app = express();
var server = http.createServer(app).listen(8080);
var mongoose = require('mongoose');
	mongoose.connect("<user mongoDB url>");

var db = mongoose.connection;
	db.on('error', function(){  console.error('Database connection failed');  });
	db.once('open',function(){  console.log('Database connection established'); });
var userSchema = mongoose.Schema({
	id: String,
	password: String,
	first_name: String,
	last_name: String,
	age: Number,
	gender: String,
	email: String,
	win: {type: Number, default: 0},
	loss: {type: Number, default: 0}
});
var gameSchema = mongoose.Schema({
	winner: String,
	loser: String,
	move: Number,
	time: String,
});
var User = mongoose.model('User', userSchema);
var Game = mongoose.model('Game', gameSchema);
var io = require('socket.io')(server); // socket set
var clients = 0;
var call_count = 0;

// Socket setup
io.on('connection', function(socket){
	console.log('New socket connection:', socket.id);
	clients ++;

	io.sockets.emit('clientChange', clients);
	socket.broadcast.emit('clientChange', clients);

	// Handle events
	socket.on('chat', function(message){
		io.sockets.emit('chat', message);
	});
	socket.on('typing', function(data){
		socket.broadcast.emit('typing', data);
	});
	socket.on('disconnect', function(message){
		clients--;
		console.log('Disconnect event, clinets:', clients);
		io.sockets.emit('clientChange', clients);
	});
	socket.on('join_game', function(data){
		io.sockets.emit('join_game', data);
	});
	socket.on('move', function(data){
		io.sockets.emit('move', data);
		socket.broadcast.emit('move', data);
	});
	socket.on('logout',function(data){
		io.sockets.emit('logout', data);
	});

	socket.on('game_conclusion', function(data){
		call_count ++ ;
		var gameplay_time = data.time + " seconds";
		// record game to the databaase
		var new_game = new Game({
			winner: data.winner,
			loser: data.loser,
			move: data.move,
			time: gameplay_time
		});
		console.log('Call count: ', call_count);

		// save the database only once
		// somehow 2 socket connections call 3 times
		// when clients log out during game
		if (call_count % 3 === 0 || clients === 1){
			console.log('Game data to save: ', data);
			new_game.save(function(err){
			if (err){
				console.log('New game record can not be saved');
			}else{
				console.log('New game record saved');
			}
			});

			// update winner's stats
			User.findOne({
				id: data.winner}, function(err, result){
				if (err || result === null) {
					console.log('User not found');
					res.redirect('back');
					next();
				}else{
					result.win += 1;
					result.save(function(err){
						if (err){
							console.log('new winner stats update failed');
							next();
						}else{
							console.log('new winner stats updated!');
						}
					});
				}
			});
			// update loser's stats
			User.findOne({
				id: data.loser}, function(err, result){
				if (err || result === null) {
					console.log('User not found');
					res.redirect('back');
					next();
				}else{
					result.loss += 1;
					result.save(function(err){
						if (err){
							console.log('new loser stats update failed');
							next();
						}else{
							console.log('new loser stats updated!');
						}
					});
				}
			});
		}
		io.sockets.emit('game_conclusion', data);
	});
});

// Static files
app.use(express.static(__dirname + ''));
app.use(express.urlencoded( { extended:false} ));
//set the view engine to ejs
app.set('view engine', 'ejs');

app.all('/', function(req,res,next){
  console.log(req.method, 'request:', req.url, JSON.stringify(req.body));
	next();
});

app.get('/', function(req,res,next){
  console.log(req.method, 'request:', req.url, JSON.stringify(req.body));
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/index.html', function(req,res,next){
		// console.log(req.method, 'request:', req.url, JSON.stringify(req.body));

		var new_user = new User({
		  id: req.body.newuser_id,
		  password: req.body.newuser_pw,
		  first_name: req.body.newuser_firstname,
		  last_name: req.body.newuser_lastnmae,
		  age: req.body.newuser_age,
		  gender: req.body.newuser_gender,
		  email: req.body.newuser_email
		});

		new_user.save(function(err){
			if (err){
				console.log('User can not be saved');
			}else{
				console.log('User saved');
			}
		});

		res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/gamepage.html', function(req,res,next){
		// console.log(req.method, 'request:', req.url, JSON.stringify(req.body));

		User.findOne({
			id: req.body.player_id,
			password: req.body.player_pw}, function(err, result){
			if (err || result === null) {
				console.log('User not found');
				res.redirect('back');
				next();
			}else{
				// console.log('User found:',result);
				player_info = result.id;
				var player_stats = result.win + ' W ' + result.loss + ' L ';
				// send user data to the page
				res.render('gamepage', { player_stats: player_stats, player_info: player_info});
			}
		});
});

// Direct new user to the registration page
app.post('/register.html', function(req,res,next){
		// console.log(req.method, 'request:', req.url, JSON.stringify(req.body));
		res.sendFile(path.join(__dirname + '/register.html'));
});

console.log("app running on 8080");
