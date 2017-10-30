CURAWORKER_PATH = "curaworker.js"

function Cura() {
  var worker = new AsmWorker(CURAWORKER_PATH);
  var stdout = '';
  var stderr = '';
  worker.print = function(s) {this.stdout += s};
  worker.printErr = function(s) {this.stderr += s}
}

Cura.prototype.load = function() {
  return this.worker.load();
}

Cura.prototype.loadFile = function() {
  
}

Cura.prototype.slice = function(defaults, extruderSettings, files) {
  var self = this;
  this.stdout = '';
  this.stderr = '';
  var files = [];
  var args = [];
  // defaults...
  args.push('-j')
  args.push('/defaults.def.json');
  var defaultsStr = defaults;
  if (type(defaults) != 'string') {
    var defaultsStr = JSON.stringify(defaults);
  }
  files.push({'path': '/defaults.def.json', 'data': defaultsStr, 'opts': {}});
  // extruder settings...
  for (var k in extruderSettings) {
    if (extruderSettings.hasOwnProperty(k)) {
      var s = extruderSettings[k];
      if (s) {
        args.push('-e' + k.toString());
        for (var option in s) {
          if (s.hasOwnProperty(option)) {
            var value = s[option];
            args.push('-s');
            args.push(option + '=' + value);
          }
        }
      }
    }
  }
  // process files to file options
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    args.push('-l');
  }
  self.load() // load worker
  .then(function(){ // load defaults
    
  })
  .then(function(){ // load extruderSettings
    
  })
}