// Make connection
var socket = io("http://localhost:8080");
var turn = Math.floor((Math.random() * 2)); // 0 or 1
var is_game_over = true;
var current_num_users;
var click_count = 0;
var players_in_game = [];
var startTime, endTime, gametime;
// Query DOM
var handle = document.getElementById('handle');
		message = document.getElementById('message'),
		sendbtn = document.getElementById('send'),
		gamebtn = document.getElementById('start_gamebtn'),
		logoutBtn = document.getElementById('logoutbtn'),
		output = document.getElementById('output'),
		feedback = document.getElementById('feedback'),
		num_users = document.getElementById('user_count_display'),
		gameinfo = document.getElementById('game_conclusion_container'),
		gameboards = document.getElementsByTagName('table');

// Default
handle.disabled = true;

function tab(here){
	var row = $(here).closest('tr').index();
	var col = $(here).closest('td').index();
	var table = $(here).closest('table').index();
	// console.log('Row: '+ row + ', Col: ' + col + ', Table: ', table);
	socket.emit('move', {player: $('#handle').val(), row: row, col: col, table: table});
}

// Emit events
sendbtn.addEventListener('click', function(){
	socket.emit('chat',{
		handle: $('#handle').val(),
		message: message.value
	});
});
gamebtn.addEventListener('click', function(){
	gamebtn.disabled = true;
	socket.emit('join_game', {	player: $('#handle').val(), stats: $('#player_stats').html()} );
});
logoutBtn.addEventListener('click', function(){
	socket.emit('logout', {player: $('#handle').val() });
	socket.close();
	window.location = './index.html';
});
message.addEventListener('keypress', function(){
	socket.emit('typing', {handle: $('#handle').val()});
});

// Listen for events
socket.on('chat', function(data){
	feedback.innerHTML = "";

	if (data.op === "logout"){
		output.innerHTML += '<p><strong>' + data.handle +' has disconnected </strong></p>';
	}else if (data.op === "conn"){
		output.innerHTML += '<p><strong>' + data.handle + ' has connected </strong></p>';
	}else{
		output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>';
	}
	message.value = "";
});
socket.on('connect', function(){
	socket.emit('chat', {op: "conn", handle: $("#handle").val()});
});
socket.on('disconnect',function(){
	players_in_game = [];
	is_game_over = true;
	socket.close();
});
socket.on('typing', function(data){
	feedback.innerHTML = '<p><em>' + data.handle + ' is typing a message... </em></p>';
});
socket.on('clientChange', function(clientNum){
	document.querySelector("#user_count_display").innerHTML = clientNum + " clients connected";
	current_num_users = clientNum;
	if (clientNum === 2){
		gamebtn.disabled = false;
	}else{
		gamebtn.disabled = true;
	}
});
socket.on('join_game', function(data){
	output.innerHTML += '<p><strong>' + data.player + ' has started the game</strong></p>';

	players_in_game.push({
		player:	data.player,
		stats: data.stats
	});


	if (Object.keys(players_in_game).length === 2){
		output.innerHTML = '<p><strong>------------ GAME START ------------</strong></p>';
		console.log('Players in game:', players_in_game[0].player, players_in_game[1].player );
		is_game_over = false;
		gamebtn.disabled = true;
		gameboards.disabled = false;
		// initialize
		for(t=0;t<3;t++){
			for(r=0;r<3;r++){
				for(c=0;c<3;c++){
					gameboards[t].rows[r].cells[c].style.backgroundColor = 'transparent';
				}
			}
		}
		startTime = new Date();
		console.log('Initial Turn: ', turn);

		if (turn === 0){
			output.innerHTML += "<p><strong> First turn is given to player '" + players_in_game[0].player + "'" + '</strong></p>';
		}else{
			output.innerHTML += "<p><strong> First turn is given to player '" + players_in_game[1].player + "'" + '</strong></p>';
		}
	}
});

socket.on('move',function(data){
	console.log('Turn: '+ turn+" - "+ data.player);
	var current_table = gameboards[data.table];
if (Object.keys(players_in_game).length === 2){
	if (	data.player === players_in_game[0].player && current_table.rows[data.row].cells[data.col].style.backgroundColor !== 'blue' && turn === 0){
		gameboards.disabled = false;
		current_table.rows[data.row].cells[data.col].style.backgroundColor = 'red';
		click_count ++;
		turn ++;
		output.innerHTML += "<p><strong>'" + data.player +"' has finished move </strong></p>";
	}else if (	data.player === players_in_game[1].player && current_table.rows[data.row].cells[data.col].style.backgroundColor !== 'red' && turn === 1){
		gameboards.disabled = false;
		current_table.rows[data.row].cells[data.col].style.backgroundColor = 'blue';
		click_count ++;
		turn --;
		output.innerHTML += "<p><strong>'" + data.player +"' has finished move </strong></p>";
	}else{
		// do nothing
	}

	gameboards.disabled = true;
	console.log('Click: ', click_count);

	// check for rows in each table
	for(t=0;t<3;t++){
		// console.log(gameboards[t].rows[0].cells[0].style.backgroundColor);
		for(i=0;i<3;i++){
			// check for horizontal rows for each table
			if (gameboards[t].rows[i].cells[0].style.backgroundColor === 'red' && gameboards[t].rows[i].cells[1].style.backgroundColor === 'red' && gameboards[t].rows[i].cells[2].style.backgroundColor === 'red'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[0].player,
					loser: players_in_game[1].player,
					move: click_count,
					time: gametime
				});
				 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
			}
			if (gameboards[t].rows[i].cells[0].style.backgroundColor === 'blue' && gameboards[t].rows[i].cells[1].style.backgroundColor === 'blue' && gameboards[t].rows[i].cells[2].style.backgroundColor === 'blue'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[0].player,
					loser: players_in_game[1].player,
					move: click_count,
					time:gametime
				});
				 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
			}
			// check for vertical rows for each table
			if (gameboards[t].rows[0].cells[i].style.backgroundColor === 'red' && gameboards[t].rows[1].cells[i].style.backgroundColor === 'red' && gameboards[t].rows[2].cells[i].style.backgroundColor === 'red'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[0].player,
					loser: players_in_game[1].player,
					move: click_count,
					time:gametime
				});
				 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
			}
			if (gameboards[t].rows[0].cells[i].style.backgroundColor === 'blue' && gameboards[t].rows[1].cells[i].style.backgroundColor === 'blue' && gameboards[t].rows[2].cells[i].style.backgroundColor === 'blue'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[0].player,
					loser: players_in_game[1].player,
					move: click_count,
					time:gametime
				});
				 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
				}
		}
		// check for diagonal rows for each table
		// from top left to bottom right
		if (gameboards[t].rows[0].cells[0].style.backgroundColor === 'red' && gameboards[t].rows[1].cells[1].style.backgroundColor === 'red' && gameboards[t].rows[2].cells[2].style.backgroundColor === 'red'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[0].player,
					loser: players_in_game[1].player,
					move: click_count,
					time:gametime
				});
				 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
		if (gameboards[t].rows[0].cells[0].style.backgroundColor === 'blue' && gameboards[t].rows[1].cells[1].style.backgroundColor === 'blue' && gameboards[t].rows[2].cells[2].style.backgroundColor === 'blue'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[1].player,
					loser: players_in_game[0].player,
					move: click_count,
					time:gametime
				});
				 alert("Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
		// from top right to bottom left
		if (gameboards[t].rows[0].cells[2].style.backgroundColor === 'red' && gameboards[t].rows[1].cells[1].style.backgroundColor === 'red' && gameboards[t].rows[2].cells[0].style.backgroundColor === 'red'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[0].player,
					loser: players_in_game[1].player,
					move: click_count,
					time:gametime
				});
				 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
		if (gameboards[t].rows[0].cells[2].style.backgroundColor === 'blue' && gameboards[t].rows[1].cells[1].style.backgroundColor === 'blue' && gameboards[t].rows[2].cells[0].style.backgroundColor === 'blue'){
				is_game_over = true;
				endTime = new Date();
				gametime = Math.round((endTime-startTime)/1000);// in 1s
				socket.emit('game_conclusion', {
					winner: players_in_game[1].player,
					loser: players_in_game[0].player,
					move: click_count,
					time: gametime
				});
				 alert("Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
	}

	// check for diagonal rows through tables
	var top_t = gameboards[0];
	var mid_t = gameboards[1];
	var bot_t = gameboards[2];

	for(r=0;r<3;r++){
		// horizontally diagonal
		if (top_t.rows[r].cells[0].style.backgroundColor === 'red' && mid_t.rows[r].cells[1].style.backgroundColor === 'red' && bot_t.rows[r].cells[2].style.backgroundColor === 'red'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[0].player,
				loser: players_in_game[1].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
		if (top_t.rows[r].cells[0].style.backgroundColor === 'blue' && mid_t.rows[r].cells[1].style.backgroundColor === 'blue' && bot_t.rows[r].cells[2].style.backgroundColor === 'blue'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[1].player,
				loser: players_in_game[0].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
		// vertically diagnoral
		if (top_t.rows[0].cells[r].style.backgroundColor === 'red' && mid_t.rows[1].cells[r].style.backgroundColor === 'red' && bot_t.rows[2].cells[r].style.backgroundColor === 'red'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[0].player,
				loser: players_in_game[1].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
		if (top_t.rows[0].cells[r].style.backgroundColor === 'blue' && mid_t.rows[1].cells[r].style.backgroundColor === 'blue' && bot_t.rows[2].cells[r].style.backgroundColor === 'blue'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[1].player,
				loser: players_in_game[0].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
	}
	// diagonally diagonal(x)
	// left top to bottom right
	if (top_t.rows[0].cells[0].style.backgroundColor === 'red' && mid_t.rows[1].cells[1].style.backgroundColor === 'red' && bot_t.rows[2].cells[2].style.backgroundColor === 'red'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[0].player,
				loser: players_in_game[1].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
	}
	if (top_t.rows[0].cells[0].style.backgroundColor === 'blue' && mid_t.rows[1].cells[1].style.backgroundColor === 'blue' && bot_t.rows[2].cells[2].style.backgroundColor === 'blue'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[1].player,
				loser: players_in_game[0].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
	}
	// right top to bottom left
	if (top_t.rows[0].cells[2].style.backgroundColor === 'red' && mid_t.rows[1].cells[1].style.backgroundColor === 'red' && bot_t.rows[2].cells[0].style.backgroundColor === 'red'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[0].player,
				loser: players_in_game[1].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
	}
	if (top_t.rows[0].cells[2].style.backgroundColor === 'blue' && mid_t.rows[1].cells[1].style.backgroundColor === 'blue' && bot_t.rows[2].cells[0].style.backgroundColor === 'blue'){
			is_game_over = true;
			endTime = new Date();
			gametime = Math.round((endTime-startTime)/1000);// in 1s
			socket.emit('game_conclusion', {
				winner: players_in_game[1].player,
				loser: players_in_game[0].player,
				move: click_count,
				time:gametime
			});
			 alert("Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
	}
	//vertically aligned
	for(r=0;r<3;r++){
		for(c=0;c<3;c++){
				if (top_t.rows[r].cells[c].style.backgroundColor === 'blue' && mid_t.rows[r].cells[c].style.backgroundColor === 'blue' && bot_t.rows[r].cells[c].style.backgroundColor === 'blue'){
						is_game_over = true;
						endTime = new Date();
						gametime = Math.round((endTime-startTime)/1000);// in 1s
						socket.emit('game_conclusion', {
							winner: players_in_game[1].player,
							loser: players_in_game[0].player,
							move: click_count,
							time:gametime
						});
						 alert("Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
				}
				if (top_t.rows[r].cells[c].style.backgroundColor === 'red' && mid_t.rows[r].cells[c].style.backgroundColor === 'red' && bot_t.rows[r].cells[c].style.backgroundColor === 'red'){
						is_game_over = true;
						endTime = new Date();
						gametime = Math.round((endTime-startTime)/1000);// in 1s
						socket.emit('game_conclusion', {
							winner: players_in_game[0].player,
							loser: players_in_game[1].player,
							move: click_count,
							time:gametime
						});
						 alert("Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
				}
		}
	}
}
});
socket.on('logout',function(data){

	socket.emit('chat', {op: "logout", handle: data.player});
	endTime = new Date();
	gametime = Math.round((endTime-startTime)/1000);// in 1s

	if (is_game_over === false){
		if (data.player === players_in_game[0].player){
			socket.emit('game_conclusion', {
				winner: players_in_game[1].player,
				loser: players_in_game[0].player,
				move: click_count,
				time:gametime
			});
			 alert(data.player + " has quit!\n" + "Winner: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")"+"\nOpponent: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}else{
			socket.emit('game_conclusion', {
				winner: players_in_game[0].player,
				loser: players_in_game[1].player,
				move: click_count,
				time:gametime
			});
			 alert(data.player + " has quit!\n" + "Winner: " + players_in_game[0].player + " ("+ players_in_game[0].stats + ")"+"\nOpponent: " + players_in_game[1].player + " ("+ players_in_game[1].stats + ")" + "\nMove: " + click_count + "\nTime: " + gametime + " seconds");
		}
	}else{
		players_in_game = [];
		click_count = 0;
		is_game_over = true;
		if (current_num_users === 2){
			gamebtn.disabled = false;
		}else{
			gamebtn.dsiabled = true;
		}

	}
	console.log('Logout:',players_in_game);

});

socket.on('game_conclusion', function(data){
	players_in_game = [];
	click_count = 0;
	is_game_over = true;
	if (current_num_users === 2){
		gamebtn.disabled = false
	}else{
		gamebtn.dsiabled = true;
	}
});
