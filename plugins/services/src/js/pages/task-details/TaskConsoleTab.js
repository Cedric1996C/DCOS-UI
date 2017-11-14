import React from "react";
import { routerShape } from "react-router";
import mixin from "reactjs-mixin";
import { StoreMixin } from "mesosphere-shared-reactjs";
import TaskConsole from "./TaskConsole";

import Task from "../../structs/Task";
import { hterm, lib } from "../hterm";
import { CONSOLE_SERVER } from "../../../config";

class TaskConsoleTab extends mixin(StoreMixin) {
  componentWillMount() {
    super.componentWillMount();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  getTaskConsole(task) {
    return <TaskConsole task={task} />;
  }

  render() {
    const { task } = this.props;

    return (
      <div className="console-page-container">
        {this.getTaskConsole(task)}
      </div>
    );
  }
}

TaskConsoleTab.contextTypes = {
  task: React.PropTypes.instanceOf(Task)
};

module.exports = TaskConsoleTab;
