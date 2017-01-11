/**
 * Created by zhigang on 14-9-5.
 */
var log4js = require('log4js');
//var stackJson = require('stack-json');
var config = require('config');
var fs = require('fs');
var path = require('path');
var opt_default = {
    "appenders": [
        {
            "type": "console"
        },
        {
            "type": "dateFile",
            "filename": "logs/access.log",
            "maxLogSize": 40960,
            "pattern": "-yyyy-MM-dd",
            "backups": 5,
            "category": "http"
        },

        {
            "type": "logLevelFilter",
            "level": "TRACE",
            "appender": {
                "type": "categoryFilter",
                "exclude": ["http"],
                "appender": {
                    "type": "dateFile",
                    "maxLogSize": 40960,
                    "pattern": "-yyyy-MM-dd",
                    "backups": 3,
                    "filename": "logs/trace.log"
                }
            }
        },
        {
            "type": "logLevelFilter",
            "level": "ERROR",
            "appender": {
                "type": "categoryFilter",
                "exclude": ["http","console"],
                "category":"app",
                "appender": {
                    "type": "dateFile",
                    "maxLogSize": 20480,
                    "pattern": "-yyyy-MM-dd",
                    "backups": 3,
                    "filename": "logs/errors.log"
                }
            }
        }
    ],
    "replaceConsole": true,
    "lineDebug": true,
    "rawMessage": false
};
var logBaseLocationDir = process.env.LOG_LOCAL_DIR || path.resolve(process.cwd(), './logs');
if (!fs.existsSync(logBaseLocationDir))
    fs.mkdirSync(logBaseLocationDir);


var _config = config.get('log');
if (_config) {
    _config.on('changed', function (config) {

        _configLog4js(_config);
    })
}
function _configLog4js(config) {

    var opts = config || opt_default;
    log4js.configure(opts);
    if (opts.lineDebug) {
        process.env.LOGGER_LINE = true;
    }
    if (opts.rawMessage) {
        process.env.RAW_MESSAGE = true;
    }
}

_configLog4js(_config);


function getLogger(name) {

    if (typeof name === 'string') {
        // category name is __filename then cut the prefix path
        name = name.replace(process.cwd(), '');
    }
    else {
        if (!name) {
            /*var filename = new Error().stackJSON.frames[1].filename;
             name = path.basename(filename, path.extname(filename));*/
            name = "app";
        }
    }

    var logger = log4js.getLogger(name);
    var pLogger = {};
    for (var key in logger) {
        pLogger[key] = logger[key];
    }
    [ 'debug', 'info', 'warn', 'error', 'trace', 'fatal'].forEach(function (item) {
        pLogger[item] = function _log() {

            var thisArgs = [].slice.call(arguments);

            var trace = new Error().stack;//new Error().stackJSON.frames[1];

            //thisArgs.unshift(formatter(trace));
            logger[item].apply(logger, thisArgs);
        }
    });
    return pLogger;
}

function prepareStackTrace(error, frames) {
    var trace = frames[0];
    return {
        // method name
        functionName: trace.getMethodName() || trace.getFunctionName() || "<anonymous>",
        //caller typeName <Object>
        typeName: trace.getTypeName(),
        // file name
        fullFilename: trace.getFileName(),
        // line number
        line: trace.getLineNumber(),
        // column number
        column: trace.getColumnNumber()
    };
}
function getTrace(caller) {
    var original = Error.prepareStackTrace,
        error = {};
    Error.captureStackTrace(error, caller || getTrace);
    Error.prepareStackTrace = prepareStackTrace;
    var stack = error.stack;
    Error.prepareStackTrace = original;
    return stack;
}
/**
 * @param trace
 * @returns {string}
 */
// format trace
function formatter(trace) {
    var stack_format = " @name (@file:@line:@column)\n ";
    /* // JSON for this stack frame.
     trace {
     pkg: pkg,
     pkgType: pkgType,
     fullFilename: fullFilename,
     filename: filename,
     line: frame.getLineNumber(),
     column: frame.getColumnNumber(),
     functionName: frame.getFunction().name || null
     };
     */
    return stack_format
        .split("@name").join(trace.functionName || trace.filename || '<anonymous>')
        .split("@file").join(trace.fullFilename)
        .split("@line").join(trace.line)
        .split("@column").join(trace.column);
}

function accessLogger() {
//    if ('object' == typeof options) {
//        options = options || {};
//    } else if (options) {
//        options = { format: options };
//    } else {
//        options = {};
//    }
    var _logger = log4js.getLogger('http');
    _logger.setLevel('INFO');
    return log4js.connectLogger.call(log4js, _logger, {level: 'auto'});
}
module.exports = {
    getLogger: getLogger,
    getDefaultLogger: log4js.getDefaultLogger,

    addAppender: log4js.addAppender,
    loadAppender: log4js.loadAppender,
    clearAppenders: log4js.clearAppenders,
    //configure: configure,

    replaceConsole: log4js.replaceConsole,
    restoreConsole: log4js.restoreConsole,

    levels: log4js.levels,
    setGlobalLogLevel: log4js.setGlobalLogLevel,

    layouts: log4js.layouts,
    appenders: log4js.appenders,
    connectLogger: accessLogger
};
