import Winston from 'winston';
// import config from './config.json';

const logger = new Winston.Logger({
    levels: {
        debug: 5,
        info: 4,
        plain: 3,
        warn: 2,
        error: 1
    },
    colors: {
        debug: 'green',
        info: 'blue',
        warn: 'yellow',
        error: 'red'
    }
});

logger.add(Winston.transports.Console, {
    // level: config.level ? config.level : 'debug',
    level: 'debug',
    colorize: true,
    prettyPrint: true
});

export default logger;