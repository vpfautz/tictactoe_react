import Field from './field';
import React, { Component } from 'react';
import './App.css';
import openSocket from 'socket.io-client';


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      symbols: [["","",""],["","",""],["","",""]],
      uuid: null,
      enabled: false,
      gameid: null,
    };
    this.socket = openSocket('http://localhost:8000');
    this.socket.on("setField", this.onSetField.bind(this));
    this.socket.on("turn", this.onTurn.bind(this));
    this.socket.on("game", this.onGame.bind(this));
    this.socket.on("winner", this.onWinner.bind(this));
    this.socket.on("setUserID", this.onUuid.bind(this));
  }

  onWinner(uuid) {
    if(uuid === "draw") {
      console.log("draw")
    } else if (uuid === this.state.uuid) {
      console.log("I won :)");
    } else {
      console.log("I lost :(");
    }
    this.setState({
      enabled: false,
    });
  }

  onUuid(uuid) {
    console.log("uuid:", uuid)
    this.setState({uuid});
  }
  onGame(gameid) {
    this.setState({
      symbols: [["","",""],["","",""],["","",""]],
      gameid: gameid,
      enabled: false,
    });
  }
  onSetField(uuid, x, y) {
    this.setField(x, y, uuid !== this.state.uuid ? "O" : "X");
  }
  onTurn(uuid) {
    this.setState({
      enabled: uuid === this.state.uuid
    });
  }

  setField(x,y,symbol) {
    let neu = this.state.symbols.map((row,y_) =>
      row.map((e, x_) => (y === y_ && x === x_) ? symbol : e)
    );
    this.setState({
      symbols: neu
    });
  }

  onClick(x,y) {
    console.log("click",x,y)
    if(!this.state.enabled) return;
    this.setState({ enabled: false });
    this.socket.emit("click", { x, y, gameid: this.state.gameid });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Tic-Tac-Toe</h1>
        </header>
        <Field
          enabled={this.state.enabled}
          symbols={this.state.symbols}
          onClick={this.onClick.bind(this)} />
      </div>
    );
  }
}

export default App;
