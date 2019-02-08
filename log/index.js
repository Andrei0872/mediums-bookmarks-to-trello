
const { createLogger, format: { printf }, transports } = require('winston');

// ==========================================================

const myFormat = printf(info => info.message)

// ==========================================================

const logger = createLogger({
    level: 'info',
    format: myFormat,
    transports: [
        new transports.File({ filename: './info.log', options: { flags: 'w' } })
    ]
})

// ==========================================================

function log(message) {
    logger.log({
        level: 'info',
        message
    })
}

// ==========================================================

module.exports = log;