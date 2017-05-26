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
import cors from 'cors';
import providers from './providers';
import type { Provider } from './entities/index';
import morgan from 'morgan';

class Server {
    constructor() {
        mongoose.connect('mongodb://localhost/huntr');
        
        this.init();
    }
    
    async init() {
        try {
            const app = express(),
                readDir = promisify(fs.readdir);

            
            app.use(cors({
                origin: (origin, callback) => 
                    config.whitelistedHosts.includes(origin) ? callback(null, true) : callback(new Error('Incorrect origin'))
            }));
            
            app.use(morgan('dev'));
            
            app.use(express.static('public'));
            
            app.use(bodyParser.json());
            app.use(expressValidator({
                customValidators: {
                    isValidConfig: async (config: any, type: string) => {
                        const provider = providers.find((provider: Provider) => provider.type === type);
                        if(provider === null) {
                            // we're only responsible for the config so w/e
                            return true;
                        }
                        if('validateConfig' in provider) {
                            const validation = provider.validateConfig(config);
                            if(validation.constructor === Promise) {
                                await validation;
                            } else {
                                return validation;
                            }
                        } else {
                            // supplied provider doesn't support configs
                            return true;
                        }
                    },
                    isValidProvider: (type: string) => providers.some((provider: Provider) => provider.type === type)
                }
            }));
            
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