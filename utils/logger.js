const { createLogger, format, transports } = require('winston');
const config = require('../config/config');

const logger = createLogger({
    level: config.logLevel,
    transports: new transports.Console({
        format: format.combine(
            format.timestamp(),
            format.json()
        )
    })
});

module.exports = logger;