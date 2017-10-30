var t1 = new Terminal('terminal')
document.getElementById('terminal-container').appendChild(t1.html)

t1.print('Loading CURA')

var worker = new AsmWorker('curaworker.js');

worker.load()
.then(function(){
  t1.print('CURA Loaded');
  worker.print = function(s){t1.print(s)};
  worker.printErr = function(s){t1.print(s)};
  repl();
})

document.getElementById('file-input').onchange = function(e) {
  var file = e.target.files[0];
  var path = prompt('Path');
  if (!path) {
    t1.print('Operation Cancelled');
    return;
  }
  var reader = new FileReader();
  // Closure to capture the file information.
  reader.onload = function(){
    var data = reader.result;
    console.log(data);
    worker.writeFile(path, data, {'encoding': 'binary', 'flags': 'w+'}).then(function(){
      t1.print('File loaded.');
    });
  };
  reader.readAsArrayBuffer(file);
}

function repl() {
  worker.cwd()
  .then(function(cwd){
    t1.input('[CURA:' + cwd + '] >', function (input) {
      var parsed = Shell.parse(input);
      console.log(parsed);
      if (parsed.length == 0) {}
      else if (parsed[0] == 'cura') {
        var args = parsed.slice(1);
        worker.exec(args).then(function(){repl()});
        return;
      } else if (parsed[0] == 'cd') {
        if (parsed.length == 2) {
          worker.cd(parsed[1])
          .then(function(){
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        }
      } else if (parsed[0] == 'rm') {
        if (parsed.length == 2) {
          worker.rm(parsed[1])
          .then(function(){
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        }
      } else if (parsed[0] == 'rmdir') {
        if (parsed.length == 2) {
          worker.rmdir(parsed[1])
          .then(function(){
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        }
      } else if (parsed[0] == 'mkdir') {
        if (parsed.length == 2) {
          worker.mkdir(parsed[1])
          .then(function(){
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        }
      } else if (parsed[0] == 'download') {
        if (parsed.length == 2) {
          worker.readFile(parsed[1], {'encoding': 'binary'})
          .then(function(data){
            var b = new Blob([data]);
            saveAs(b, parsed[1].replace('/','-'));
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        }
      } else if (parsed[0] == 'pwd') {
        if (parsed.length == 1) {
          worker.cwd()
          .then(function(cwd){
            t1.print(cwd);
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        }
      } else if (parsed[0] == 'ls') {
        if (parsed.length == 1) 
        {
          worker.cwd()
          .then(function(cwd){
            return worker.ls(cwd);
          })
          .then(function(files){
            t1.print(files.join(' '));
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        } 
        else if (parsed.length == 2) {
          worker.ls(parsed[1])
          .then(function(files){
            t1.print(files.join(' '));
            repl();
          }).catch(function(error){
            t1.print(error.toString());
            repl();
          })
          return;
        }
      } else {
        t1.print(parsed[0] + ' is not supported');
      }
      repl();
    })
  })
}
