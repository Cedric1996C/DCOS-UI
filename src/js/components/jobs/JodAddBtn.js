/* eslint-disable no-unused-vars */
import React, { Component } from "react";
/* eslint-enable no-unused-vars */
// import FilterInputText from "./FilterInputText";

class JobAddBtn extends Component {
  constructor(props) {
    super(...props);
  }

  render() {
    const { onClick } = this.props;

    return (
      <button className="button button-success" onClick={onClick}>
        New Job
      </button>
    );
  }
}

JobAddBtn.propTypes = {
  onClick: React.PropTypes.func.isRequired
};

module.exports = JobAddBtn;
