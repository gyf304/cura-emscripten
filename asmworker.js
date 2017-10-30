ASMLOADER_PATH = 'asmloader.js'

function AsmWorker(path) {
  var self = this;
  this.path = path;
  this.acks = {};
  //this._dispatchTask = null;
}

AsmWorker.prototype._onmessage = function(e) {
  var self = this;
  var data = e.data;
  var type = data.type;
  var id = data.id;
  var args = data.args;
  if (type == 'ack') {
    if (args && args.id) {
      if (args.success) {
        self.acks[args.id].resolve(args.msg)
      } else {
        self.acks[args.id].reject(args.error);
      }
    }
  } else if (type == 'io') {
    if (args.file == 'stdout') {
      if (self.print) self.print(args.data);
    } else if (args.file == 'stderr') {
      if (self.printErr) self.printErr(args.data);
    }
  }
};

AsmWorker.prototype._dispatchTask = function (message) {
  var self = this;
  var id = Math.random().toString(36).substr(2, 10);
  var msg = Object.assign({'id': id}, message);
  var promise = new Promise(function(resolve, reject) {
    self.acks[id] = {'resolve': resolve, 'reject': reject};
  });
  self.worker.postMessage(msg);
  return promise;
};

AsmWorker.prototype.load = function() {
  var self = this;
  var path = this.path;
  if (self.worker) {
    return new Promise(function(resolve, reject){resolve();});
  } else {
    self.worker = new Worker(ASMLOADER_PATH);
    self.worker.onmessage = function(e) {
      self._onmessage(e);
    };
    return self._dispatchTask({'type': 'load', 'args': {'path': path}});
  }
};

AsmWorker.prototype.mkdir = function(path) {
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'mkdir', 'path': path}});
};

AsmWorker.prototype.writeFile = function(path, data, opts) {
  console.log(this);
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'write', 'path': path, 'data': data, 'opts': opts}});
};

AsmWorker.prototype.readFile = function(path, opts) {
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'read', 'path': path, 'opts': opts}});
};

AsmWorker.prototype.rm = function(path) {
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'rm', 'path': path}});
};

AsmWorker.prototype.rmdir = function(path) {
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'rmdir', 'path': path}});
};

AsmWorker.prototype.ls = function(path) {
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'readdir', 'path': path}});
};

AsmWorker.prototype.cwd = function() {
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'cwd'}});
};

AsmWorker.prototype.cd = function(path) {
  return this._dispatchTask({'type': 'fs', 'args': {'operation': 'chdir', 'path': path}});
};

AsmWorker.prototype.exec = function(argv) {
  return this._dispatchTask({'type': 'exec', 'args': {'argv': [self.path].concat(argv)}});
};
