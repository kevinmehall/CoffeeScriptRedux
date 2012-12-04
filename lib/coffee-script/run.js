// Generated by CoffeeScript 2.0.0-dev
var CoffeeScript, formatSourcePosition, fs, Module, patched, patchStackTrace, path, runModule, SourceMapConsumer;
fs = require('fs');
path = require('path');
Module = require('module');
CoffeeScript = require('./module');
SourceMapConsumer = require('source-map').SourceMapConsumer;
patched = false;
patchStackTrace = function () {
  if (patched)
    return;
  patched = true;
  return Error.prepareStackTrace = function (err, stack) {
    var frames, getSourceMapping, sourceFiles;
    sourceFiles = {};
    getSourceMapping = function (filename, line, column) {
      var mod, sourceMap;
      mod = Module._cache[filename];
      if (mod && mod.getSourceMap) {
        sourceMap = null != sourceFiles[filename] ? sourceFiles[filename] : sourceFiles[filename] = new SourceMapConsumer(mod.getSourceMap());
        return sourceMap.originalPositionFor({
          line: line,
          column: column
        });
      }
    };
    frames = stack.map(function (frame) {
      var e;
      try {
        return '  at ' + formatSourcePosition(frame, getSourceMapping);
      } catch (e$) {
        e = e$;
        console.log(e);
        return '';
      }
    });
    return [
      'ERROR: ' + err.message,
      '',
      frames.join('\n')
    ].join('\n');
  };
};
formatSourcePosition = function (frame, getSourceMapping) {
  var addPrefix, column, fileLocation, fileName, functionName, isConstructor, isMethodCall, line, methodName, source;
  fileName = void 0;
  fileLocation = '';
  if (frame.isNative()) {
    fileLocation = 'native';
  } else if (frame.isEval()) {
    fileName = frame.getScriptNameOrSourceURL();
    if (!fileName)
      fileLocation = frame.getEvalOrigin();
  } else {
    fileName = frame.getFileName();
  }
  if (fileName) {
    line = frame.getLineNumber();
    column = frame.getColumnNumber();
    if (source = getSourceMapping(fileName, line, column)) {
      fileLocation = '' + fileName + ':' + source.line + ':' + source.column + ', <js>:' + line + ':' + column;
    } else {
      fileLocation = '' + fileName + ':' + line + ':' + column;
    }
  }
  if (!fileLocation)
    fileLocation = 'unknown source';
  line = '';
  functionName = frame.getFunction().name;
  addPrefix = true;
  isConstructor = frame.isConstructor();
  isMethodCall = !(frame.isToplevel() || isConstructor);
  if (isMethodCall) {
    methodName = frame.getMethodName();
    line += frame.getTypeName() + '.';
    if (functionName) {
      line += functionName;
      if (methodName && methodName !== functionName)
        line += ' [as ' + methodName + ']';
    } else {
      line += methodName || '<anonymous>';
    }
  } else if (isConstructor) {
    line += 'new ' + (functionName || '<anonymous>');
  } else if (functionName) {
    line += functionName;
  } else {
    line += fileLocation;
    addPrefix = false;
  }
  if (addPrefix)
    line += ' (' + fileLocation + ')';
  return line;
};
exports.runMain = function (csSource, jsSource, jsAst, filename) {
  var mainModule;
  mainModule = new Module('.');
  mainModule.filename = process.argv[1] = filename;
  process.mainModule = mainModule;
  Module._cache[mainModule.filename] = mainModule;
  mainModule.paths = Module._nodeModulePaths(path.dirname(filename));
  return runModule(mainModule, jsSource, jsAst, filename);
};
runModule = function (module, jsSource, jsAst, filename) {
  patchStackTrace();
  module.getSourceMap = function () {
    return CoffeeScript.sourceMap(jsAst, filename);
  };
  return module._compile(jsSource, filename);
};
require.extensions['.coffee'] = function (module, filename) {
  var csAst, input, js, jsAst;
  input = fs.readFileSync(filename, 'utf8');
  csAst = CoffeeScript.parse(input);
  jsAst = CoffeeScript.compile(csAst);
  js = CoffeeScript.js(jsAst);
  return runModule(module, js, jsAst, filename);
};