const morgan = require('morgan');
const logger = require('./logger');

const stream = {
    write: (message) => logger.info(message.trim()),
};

const successHandler = morgan('combined', {
    skip: (req, res) => res.statusCode >= 400,
    stream,
});

const errorHandler = morgan('combined', {
    skip: (req, res) => res.statusCode < 400,
    stream,
});

module.exports = {
    successHandler,
    errorHandler,
};
