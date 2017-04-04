// @flow

import config from './config.json';
import { emoji } from 'node-emoji';
import logger from './logger';
import mongoose from 'mongoose';
import express from 'express';
import fs from 'fs';
import promisify from 'es6-promisify';
import detect from 'detect-port';
import bodyParser from 'body-parser';
import expressValidator from 'express-validator';

class Server {
    constructor() {
        mongoose.connect('mongodb://localhost/huntr');
        
        this.init();
    }
    
    async init() {
        try {
            const app = express(),
                readDir = promisify(fs.readdir);

            app.use(bodyParser.json());
            app.use(expressValidator());
            
            const path = __dirname + '/controllers';
            for(const file of await readDir(path)) {
                const controller = require(path + '/' + file).default;
                new controller(app);
            }
    
            app.use(function (req, res, next) {
                const err = new Error('Not Found');
                err.status = 404;
                next(err);
            });
            
            const port = await detect(config.port);
            
            if(port !== config.port) {
                throw new Error(`${emoji.warning}  Port ${config.port} appears to be occupied, perhaps try "${port}".`);
            }
    
            app.listen(port);
            logger.info(`${emoji.fire}  huntr is listening on http://localhost:${port}/`);
        } catch(ex) {
            logger.error(ex);
            process.exit();
        }
    }
}

export default new Server();