import React, { Component } from 'react';

class Part extends Component {
  render() {
    return (
      <span className={this.props.enabled?"part":"part-disabled"} onClick={this.props.onClick}>
        {this.props.symbol}
      </span>
    );
  }
}

export default Part;
