/**
 * Created by zhigang on 14-9-5.
 */

function errorthrow() {
    throw  new Error('this is a function test error handle')
}
var logger = require('./logger.js').getLogger();
(function myerror() {
    try {
        errorthrow();
    } catch (err) {
        logger.error(err);
    }
})();
logger.warn(new Error('this is a test warn string'));
logger.debug('this is a test debug string');
logger.error('this is a test error string', new Error());
logger.warn('this is a test warn string')