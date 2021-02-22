'use strict';
const utils = require('@iobroker/adapter-core');
let net = require('net');
let adapter, query, recnt, boiler, in_msg, out_msg, states = {}, old_states = {}, tabu = false, _connect = false;
const polling_time = 3000;
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
    name: 'boiler',
    ready: main,
    unload: (callback) => {
      try {
        adapter.log.debug('cleaned everything up...');
        query && clearInterval(query);
        recnt && clearTimeout(recnt);
        boiler && boiler.destroy();
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
  out_msg = Buffer.concat([Buffer.from([170, 4, 10, 0]), Buffer.from([in_msg[3]]), Buffer.from([in_msg[5]])]);
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

function connect(cb) {
  let host = adapter.config.host ? adapter.config.host : '127.0.0.1';
  let port = adapter.config.port ? adapter.config.port : 23;
  adapter.log.debug('boiler ' + 'connect to: ' + host + ':' + port);
  boiler = net.connect(port, host, function () {
    clearTimeout(recnt);
    adapter.setState('info.connection', true, true);
    adapter.log.info('boiler connected to: ' + host + ':' + port);
    _connect = true;
    clearInterval(query);
    query = setInterval(function () {
      if (!tabu) {
        send(command.qstn);
      }
    }, polling_time);
    cb && cb();
  });
  boiler.on('data', function (chunk) {
    adapter.log.debug("boiler raw response: {" + chunk.toString('hex') + '} Length packet:[' + chunk.length + ']');
    if (chunk.length === 12) {
      in_msg = Buffer.from(chunk);
      adapter.log.debug("boiler incomming: " + in_msg.toString('hex'));
      parse(in_msg);
    } else {
      adapter.log.error("Error length packet. Raw response: {" + chunk.toString('hex') + '} Length packet:[' + chunk.length + ']');
    }
  });
  boiler.on('error', function (e) {
    err(e);
  });
  boiler.on('close', function (e) {
    if (_connect) {
      err('boiler disconnected');
    }
    reconnect();
  });
}

function send(cmd) {
  cmd = Buffer.from(cmd);
  if (cmd !== undefined) {
    cmd = packet(cmd);
    adapter.log.debug('Send Command: ' + cmd.toString("hex"));
    boiler.write(cmd);
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
  boiler.destroy();
  old_states = {};
  _connect = false;
  adapter.log.info('Reconnect after 60 sec...');
  recnt = setTimeout(() => {
    connect();
  }, 60000);
}

function err(e) {
  adapter.log.error("boiler " + e);
  if (e.code === "ENOTFOUND" || e.code === "ECONNREFUSED" || e.code === "ETIMEDOUT") {
    boiler.destroy();
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