import React from "react";
import mixin from "reactjs-mixin";
import { StoreMixin } from "mesosphere-shared-reactjs";
import Task from "../../structs/Task";
import { hterm, lib } from "../hterm";
import { CONSOLE_SERVER } from "../../../config";

class TaskConsole extends mixin(StoreMixin) {
  componentWillMount() {
    super.componentWillMount();
    const { task } = this.props;
    var term;
    this.initializeConsole(task.id, term, this.sendMessage);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  sendMessage(ws, type, content) {
    var message = JSON.stringify({
      type,
      content
    });
    if (ws.readyState !== 3) {
      ws.send(message);
    }
  }

  initializeConsole(id, term, sendMessage) {
    const ws_url = `ws://${CONSOLE_SERVER}/console/ws?task_id=${id}`;
    const ws = new WebSocket(ws_url);
    var autoReconnect = -1;
    ws.onopen = function(event) {
      sendMessage(ws, 2, JSON.stringify({ Arguments: "", AuthToken: "" }));
      // pingTimer = setInterval(sendPing, 30 * 1000, ws);
      hterm.defaultStorage = new lib.Storage.Local();
      hterm.defaultStorage.clear();

      term = new hterm.Terminal();
      term.getPrefs().set("send-encoding", "raw");
      term.onTerminalReady = function() {
        var io = term.io.push();
        io.onVTKeystroke = function(str) {
          sendMessage(ws, 4, str);
        };
        io.sendString = io.onVTKeystroke;

        // when user resize browser, send columns and rows to server.
        io.onTerminalResize = function(columns, rows) {
          sendMessage(ws, 3, JSON.stringify({ columns, rows }));
        };
        term.installKeyboard();
      };
      term.decorate(document.getElementById("terminal"));

      return term;
    };

    ws.onmessage = function(event) {
      var data = JSON.parse(event.data);
      switch (data.type) {
        case 5:
          // decode message and convert to utf-8
          term.io.writeUTF8(window.atob(data.content));
          break;
        case 1:
          // pong
          break;
        case "set-title":
          term.setWindowTitle(data.content);
          break;
        case "set-preferences":
          var preferences = JSON.parse(data.content);
          Object.keys(preferences).forEach(function(key) {
            console.log("Setting " + key + ": " + preferences[key]);
            term.getPrefs().set(key, preferences[key]);
          });
          break;
        case "set-autoreconnect":
          autoReconnect = JSON.parse(data.content);
          console.log("Enabling reconnect: " + autoReconnect + " seconds");
          break;
        case 6:
          term.io.writeUTF8(window.atob(data.content));
          break;
        default:
          // unidentified message
          term.io.writeUTF8("Invalid message: " + event.data);
      }
    };

    ws.onclose = function(event) {
      if (term) {
        term.uninstallKeyboard();
        term.io.showOverlay("Connection Closed", null);
      }
    };
  }

  render() {
    return <div id="terminal" />;
  }
}

// TaskConsoleTab.contextTypes = {
//   task: React.PropTypes.instanceOf(Task)
// };

module.exports = TaskConsole;
