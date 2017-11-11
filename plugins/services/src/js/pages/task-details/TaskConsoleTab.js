import React from "react";
import { routerShape } from "react-router";
import mixin from "reactjs-mixin";
import { StoreMixin } from "mesosphere-shared-reactjs";
import Task from "../../structs/Task";
import { hterm, lib } from "../hterm";

class TaskConsoleTab extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);
  }

  componentWillMount() {
    super.componentWillMount();
    const { task } = this.props;
    console.log(task);
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
    const ws_url = `ws://${window.location.host}/console/ws?task_id=${id}`;
    const ws = new WebSocket(ws_url);
    ws.onopen = function(event) {
      sendMessage(ws, 2, JSON.stringify({ Arguments: "", AuthToken: ""}));
      // pingTimer = setInterval(sendPing, 30 * 1000, ws);
      hterm.defaultStorage = new lib.Storage.Local();
      hterm.defaultStorage.clear();

      term = new hterm.Terminal();
      term.getPrefs().set("send-encoding", "raw");
      term.onTerminalReady = function() {
        var io = term.io.push();
        io.onVTKeystroke = function(str) {
            console.log(str)
            sendMessage(ws, 4, str);
        };
        io.sendString = io.onVTKeystroke;

        // when user resize browser, send columns and rows to server.
        io.onTerminalResize = function(columns, rows) {
            sendMessage(ws, 3, JSON.stringify({columns: columns, rows: rows}))
        };
        term.installKeyboard();
      };
      term.decorate(document.getElementById("terminal"));
      return term;
    };

    ws.onmessage = function(event) {
      var data = JSON.parse(event.data);
      switch(data.type) {
        case 5:
          // decode message and convert to utf-8
          console.log(data.content);
          term.io.writeUTF8(window.atob(data.content));
          break;
        case 1:
          // pong
          break;
        case 'set-title':
          term.setWindowTitle(data.content);
          break;
        case 'set-preferences':
          var preferences = JSON.parse(data.content);
          Object.keys(preferences).forEach(function(key) {
              console.log("Setting " + key + ": " +  preferences[key]);
              term.getPrefs().set(key, preferences[key]);
          });
          break;
        case 'set-autoreconnect':
          autoReconnect = JSON.parse(data.content);
          console.log("Enabling reconnect: " + autoReconnect + " seconds")
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
      clearInterval(pingTimer);
      if (autoReconnect > 0) {
          setTimeout(openWs, autoReconnect * 1000);
      }
    };
  }

  render() {
    return (
        <div id="terminal" className="console-page-container"></div>
    );
  }

}

TaskConsoleTab.contextTypes = {
  params: React.PropTypes.object,
  routes: React.PropTypes.array,
  task: React.PropTypes.instanceOf(Task),
  router: routerShape
};

module.exports = TaskConsoleTab;
