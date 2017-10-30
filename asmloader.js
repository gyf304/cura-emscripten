/*
 A simple ASM.js loader
*/
Module = {};
Module.noInitialRun = true;
Module.noExitRuntime = true;
Module.print = function(text) {
  postMessage({'type': 'io', 'args': {'file': 'stdout', 'data': text}});
};
Module.printErr = function(text) {
  postMessage({'type': 'io', 'args': {'file': 'stderr', 'data': text}});
};
Module.environment = 'WORKER';

function stringToArrayBuffer(string) {
  var enc = new TextEncoder("utf-8");
  return enc.encode(string);
}

onmessage = function(e) {
  var type = e.data.type;
  var args = e.data.args;
  var id = e.data.id;
  if (type == 'fs') {
    // file system operations
    if (args.operation == 'mkdir') {
      try {
        FS.mkdir(args.path);
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id}});
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    } else if (args.operation == 'write') {
      try {
        console.log(args);
        FS.writeFile(args.path, new Uint8Array(args.data), args.opts);
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id}});
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    } else if (args.operation == 'read') {
      try {
        var buffer = FS.readFile(args.path, args.opts);
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id, 'msg': buffer}});
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    } else if (args.operation == 'rm') {
      try {
        FS.unlink(args.path);
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id}});
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    } else if (args.operation == 'rmdir') {
      try {
        FS.rmdir(args.path);
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id}});
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    } else if (args.operation == 'readdir') {
      try {
        var result = FS.readdir(args.path);
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id, 'msg': result}})
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    } else if (args.operation == 'cwd') {
      try {
        var result = FS.cwd();
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id, 'msg': result}})
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    } else if (args.operation == 'chdir') {
      try {
        var result = FS.chdir(args.path);
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id, 'msg': result}})
      } catch (error) {
        postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
      }
    }
  } else if (type == 'exec') {
    try {
      var argv = args.argv;
      var argvBufs = [];
      var total = 0;
      var argvOffsets = [];
      for (var i = 0; i < argv.length; i++) {
        var arg = argv[i];
        var buf = stringToArrayBuffer(arg);
        argvBufs.push(buf);
        argvOffsets.push(total);
        total += buf.length + 1;
      }
      var argvStrPtr = Module._malloc(total);
      for (var i = 0; i < argvBufs.length; i++) {
        var buf = argvBufs[i];
        var arr = new Uint8Array(Module.HEAPU8.buffer, argvStrPtr + argvOffsets[i], buf.buffer.byteLength + 1);
        arr.set(buf);
        arr[buf.buffer.byteLength] = 0;
      }
      // allocate buffer for pointer to pointers
      var argvPtr = Module._malloc(argvOffsets.length * 4);
      var argvBuf = new Uint32Array(argvOffsets.length * 4);
      for (var i = 0; i < argvBuf.length; i++) {
        argvBuf[i] = argvStrPtr + argvOffsets[i];
      }
      // copy ptrs to heap
      var argvHeap = new Uint32Array(Module.HEAPU8.buffer, argvPtr, argvBuf.buffer.byteLength);
      argvHeap.set(argvBuf);
      var exitStatus = 0;
      try {
        exitStatus = Module._main(argv.length, argvPtr);
      } catch (error) {
        if (error.name == 'ExitStatus') {
          exitStatus = error.status;
        } else {
          throw error;
        }
      }
      Module._free(argvStrPtr);
      Module._free(argvPtr);
      postMessage({'type': 'ack', 'args': {'success': true, 'id': id, 'msg': exitStatus}});
    } catch (error) {
      postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
    }
  } else if (type == 'load') {
    try {
      Module.onRuntimeInitialized = function(){
        postMessage({'type': 'ack', 'args': {'success': true, 'id': id}});
      }; // wait until everything is loaded...
      importScripts(args.path);
    } catch (error) {
      postMessage({'type': 'ack', 'args': {'success': false, 'error': error.toString(), 'id': id}});
    }
  }
}
