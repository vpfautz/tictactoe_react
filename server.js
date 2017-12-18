const uuid4 = require("uuid/v4");
const io = require('socket.io')();


class Game {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.field = [[0,0,0],[0,0,0],[0,0,0]];
    this.id = uuid4();
    this.next = 1;
    this.winner = null;

    clients.get(this.player1).emit("game", this.id);
    clients.get(this.player2).emit("game", this.id);

    this.sendTurn();
  }

  playerDisconnected(uuid) {
    if (this.next == 0) return;
    this.winner = uuid == this.player1 ? this.player2 : this.player1;
    console.log("winner, because of disconnect:", this.winner);
    clients.get(this.winner).emit("winner", this.winner);
    this.next = 0;
  }

  sendTurn() {
    if (this.next == 0) return;
    let next_uuid = this.next == 1 ? this.player1 : this.player2;
    clients.get(this.player1).emit("turn", next_uuid);
    clients.get(this.player2).emit("turn", next_uuid);
  }

  click(uuid, x, y) {
    if(uuid != this.player1 && uuid != this.player2) {
      console.error("uuid %s not matching to game %s", uuid, this.id);
      this.sendTurn();
      return;
    }
    let user = uuid == this.player1 ? 1 : 2;
    if(user != this.next) {
      console.error("not your turn, turn: %d", this.next);
      this.sendTurn();
      return;
    }
    if(this.field[y][x] != 0) {
      console.error("field already set!");
      this.sendTurn();
      return;
    }
    this.field[y][x] = user;
    clients.get(this.player1).emit("setField", uuid, x, y);
    clients.get(this.player2).emit("setField", uuid, x, y);
    if(this.checkWin()) {
      clients.get(this.player1).emit("winner", this.winner);
      clients.get(this.player2).emit("winner", this.winner);
      console.log("winner:", this.winner);
      this.next = 0;
      return;
    }
    if(this.checkDraw()) {
      clients.get(this.player1).emit("winner", "draw");
      clients.get(this.player2).emit("winner", "draw");
      console.log("draw");
      this.next = 0;
      return;
    }
    this.next = this.next == 1 ? 2 : 1;
    this.sendTurn();
  }

  checkDraw() {
    for(let row of this.field) {
      for(let x of row) {
        if (x == 0) {
          return false;
        }
      }
    }

    this.winner = "draw";
    return true;
  }

  checkWin() {
    for(let i=0;i<3;i++){
      if(this.field[i][0] & this.field[i][1] & this.field[i][2]) {
        this.winner = this.field[i][0] == 1 ? this.player1 : this.player2;
        return true;
      }
      if(this.field[0][i] & this.field[1][i] & this.field[2][i]) {
        this.winner = this.field[0][i] == 1 ? this.player1 : this.player2;
        return true;
      }
    }
    if(this.field[0][0] & this.field[1][1] & this.field[2][2]) {
      this.winner = this.field[0][0] == 1 ? this.player1 : this.player2;
      return true;
    }
    if(this.field[2][0] & this.field[1][1] & this.field[0][2]) {
      this.winner = this.field[0][0] == 1 ? this.player1 : this.player2;
      return true;
    }

    return false;
  }
}

function checkCoords(x,y) {
  if(typeof x != "number" || typeof y != "number") return false;
  return x>=0 && x<=2 && y>=0 && y<=2;
}

// gameid -> game
let games = new Map();
// uuid[]
let userQueue = [];

// uuid -> client
let clients = new Map();

io.on('connection', function (client) {
  const uuid = client.id;
  console.log("user " + uuid + " connected");
  client.emit('setUserID', uuid);
  clients.set(uuid, client);
  if(userQueue.length > 0) {
    const other = userQueue.pop();
    let game = new Game(other, uuid);
    console.log("start game", other, uuid)
    games.set(game.id, game);
  } else {
    userQueue = [uuid].concat(userQueue);
  }

  client.on('click', ({x,y,gameid}) => {
    if(!games.has(gameid)) return;
    if(!checkCoords(x,y)) return;
    let game = games.get(gameid);
    game.click(client.id, x, y);
    if(game.next == 0){
      games.delete(game.id);
    }
  });

  client.on('disconnect', function() {
    if (client.id === null) return;
    console.log(client.id, 'disconnected!');
    clients.delete(client.id);

    for(let game of games.values()) {
      if (game.player1 == client.id || game.player2 == client.id) {
        console.log("end game", game.id);
        game.playerDisconnected(client.id);
        games.delete(game.id);
      }
    }

    userQueue = userQueue.filter(e => e != client.id);
  });
});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);
