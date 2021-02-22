'use strict';
const utils = require('@iobroker/adapter-core');
let net = require('net');
let adapter, query, recnt, balluboiler, in_msg, out_msg, states = {}, old_states = {}, tabu = false, _connect = false;
const polling_time = 10000;
// [170, 4, 10, 0, 1, 35, 220] // включение 1 режим 35 градусов
// [170, 4, 10, 0, 2, 61, 247] // включение 2 режим 61 градусов
const command = {
  qstn: [170, 3, 8, 16, 4, 201], // Команда опроса
};
const byte = {
  mode: 3,
  temp_cur: 4,
  temp: 5,
};

function startAdapter(options) {
  return adapter = utils.adapter(Object.assign({}, options, {
    systemConfig: true,
    name: 'balluboiler',
    ready: main,
    unload: (callback) => {
      try {
        adapter.log.debug('cleaned everything up...');
        query && clearInterval(query);
        recnt && clearTimeout(recnt);
        balluboiler && balluboiler.destroy();
        callback();
      } catch (e) {
        callback();
      }
    },
    stateChange: (id, state) => {
      if (id && state && !state.ack) {
        adapter.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        let ids = id.split(".");
        let val = state.val;
        let cmd = ids[ids.length - 1].toString().toLowerCase();
        adapter.log.debug('cmd ' + cmd);
        sendCmd(cmd, val);
      }
    }
  }));
}

function sendCmd(cmd, val) {
  if (['mode', 'temp', 'raw'].includes(cmd)) {
    out_msg = Buffer.from([170, 4, 10, 0, states.mode, states.temp]);
    tabu = true;
    switch (cmd) {
      case 'mode': //0 - выклл, 1 - вкл один тэн, 2 - вкл два тэна
        if (val === 'off' || val === 0) {
          val = 0;
        } else if (val === 'one' || val === 1) {
          val = 1;
        } else if (val === 'two' || val === 2) {
          val = 2;
        }
        out_msg[4] = val;
        send(out_msg);
        break;
      case 'temp': // температура
        out_msg[5] = val;
        send(out_msg);
        break;
      case 'raw':
        send(toArr(val, 2));
        break;
      default:
    }
  }
}

function connect(cb) {
  let host = adapter.config.host ? adapter.config.host : '127.0.0.1';
  let port = adapter.config.port ? adapter.config.port : 23;
  adapter.log.debug('balluboiler ' + 'connect to: ' + host + ':' + port);
  balluboiler = net.connect(port, host, function () {
    clearTimeout(recnt);
    adapter.setState('info.connection', true, true);
    adapter.log.info('balluboiler connected to: ' + host + ':' + port);
    _connect = true;
    clearInterval(query);
    query = setInterval(function () {
      if (!tabu) {
        send(command.qstn);
      }
    }, polling_time);
    cb && cb();
  });
  balluboiler.on('data', function (chunk) {
    adapter.log.debug("balluboiler raw response: {" + chunk.toString('hex') + '} Length packet:[' + chunk.length + ']');
    if (chunk.length === 1 && chunk[0] === 170) {
      in_msg = Buffer.from(chunk);
    } else {
      in_msg = Buffer.concat([in_msg, chunk]);
    }
    if (in_msg.length === 12) {
      adapter.log.debug("balluboiler incomming: " + in_msg.toString('hex'));
      parse(in_msg);
    }
  });
  balluboiler.on('error', function (e) {
    err(e);
  });
  balluboiler.on('close', function (e) {
    if (_connect) {
      err('balluboiler disconnected');
    }
    reconnect();
  });
}

function send(cmd) {
  cmd = Buffer.from(cmd);
  if (cmd !== undefined) {
    cmd = packet(cmd);
    adapter.log.debug('Send Command: ' + cmd.toString("hex"));
    balluboiler.write(cmd);
    tabu = false;
  }
}

function parse(msg) {
  states.mode = ['off', 'one', 'two'][msg[byte.mode]]; // Режим (выкл, один тэн, два тэна)
  states.temp_cur = msg[byte.temp_cur]; // Текущая температура
  states.temp = msg[byte.temp]; // Установленная температура

  adapter.log.debug('states ' + JSON.stringify(states));

  Object.keys(states).forEach(function (key) {
    if (states[key] !== old_states[key]) {
      old_states[key] = states[key];
      adapter.setState(key, {val: states[key], ack: true});
    }
  });
}

function packet(data) {
  let chksum = CRC(data);
  return Buffer.concat([data, Buffer.from([chksum])]);
}

function CRC(d) {
  let sum = 0;
  for (let key of d.keys()) {
    sum += d[key];
  }
  return sum;
}

function toArr(text, numb) {
  let arr = [], res;
  for (let i = 0; i < text.length / numb; i++) {
    res = parseInt(text.slice(numb * i, numb * i + numb), 16);
    if (!isNaN(res)) {
      arr.push(res);
    }
  }
  return arr;
}

function reconnect() {
  adapter.setState('info.connection', false, true);
  query && clearInterval(query);
  recnt && clearTimeout(recnt);
  balluboiler.destroy();
  old_states = {};
  _connect = false;
  adapter.log.info('Reconnect after 60 sec...');
  recnt = setTimeout(() => {
    connect();
  }, 60000);
}

function err(e) {
  adapter.log.error("balluboiler " + e);
  if (e.code === "ENOTFOUND" || e.code === "ECONNREFUSED" || e.code === "ETIMEDOUT") {
    balluboiler.destroy();
  }
}

function main() {
  adapter.subscribeStates('*');
  connect();
}

if (module.parent) {
  module.exports = startAdapter;
} else {
  startAdapter();
}