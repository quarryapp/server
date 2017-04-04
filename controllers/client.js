// @flow

import { Router } from 'express';
import crypto from 'crypto';
import promisify from 'es6-promisify';
import Client from '../models/client';

const randomBytes = promisify(crypto.randomBytes);

export default class ClientController {
    constructor(app) {
        this.router = Router();
        app.use('/client', this.router);
        
        this.router.put('/', this.put.bind(this));
    }
    
    async put(req, res, next) {
        try {
            const hash = crypto.createHash('sha256');
            hash.update(await randomBytes(256));
            const token = hash.digest('hex');
            
            const client = new Client({
                token
            });

            await client.save();

            res.status(201).send(client);
        }
        catch(ex) {
            next(ex);
        }
    }
}