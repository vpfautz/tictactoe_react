import Part from "./part";
import React, { Component } from 'react';

class Field extends Component {
  render() {
    let f = [];
    for(let y = 0; y < 3; y++){
      let row = [];
      for(let x = 0; x < 3; x++){
        row.push(<Part
          enabled={this.props.enabled}
          symbol={this.props.symbols[y][x]}
          onClick={e => this.props.onClick(x,y)}
        />);
      }
      f.push(<div className="row">{row}</div>);
    }

    return (
      <div className="field">
        { f }
      </div>
    );
  }
}

export default Field;
