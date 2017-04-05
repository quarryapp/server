// @flow

import { Router } from 'express';
import Client from '../models/client';
import Provider from '../models/provider';
import ClientProvider from '../models/clientprovider';
import FeedItem from '../models/feeditem';
import logger from '../logger';
import providerTypes from '../providers';
import config from '../config.json';
import { emoji } from 'node-emoji';
import order from '../services/order';

export default class FeedController {
    router = null;
    providerMap = new Map();

    constructor(app) {
        this.router = Router();
        app.use('/feed', this.router);

        for (let provider of providerTypes) {
            this.providerMap.set(provider.type, provider);
        }

        // 'authorization' 'layer'
        this.router.use(async(req, res, next) => {
            try {
                const authHeader = req.get('Authorization');
                if (authHeader.substring(0, 7) !== 'Bearer ') {
                    throw new Error('Invalid authorization header');
                }

                const client = await Client.findOne({ token: authHeader.substring(7) });
                if (!client) {
                    throw new Error('Client not found');
                }

                req.client = client;
                next();
            } catch (ex) {
                next(ex);
            }
        });

        this.router.get('/', this.getFeed.bind(this));
        this.router.put('/provider', this.putProvider.bind(this));
    }

    async getFeed(req, res, next) {
        try {
            const { _id: client } = req.client;
            
            const clientProviders = await ClientProvider.find({ client });
            for(let clientProvider of clientProviders) {
                const providerModel = await Provider.findOne({
                    _id: clientProvider.provider
                });
                
                if(!providerModel) {
                    throw new Error('ClientProvider used a non-existing Provider');
                }
                
                if (!await FeedItem.find({ expiration: { $lte: new Date() }, type: providerModel.type }).count()) { // todo add config to query
                    if (!this.providerMap.has(providerModel.type)) {
                        logger.warn(`Attempted to look for unexisting provider ${providerModel.type} (?!)`);
                        continue;
                    }
                    logger.debug(`Fetching new feed provider ${providerModel.type} (config: ${JSON.stringify(providerModel.config)})`);
                    
                    const Provider = this.providerMap.get(providerModel.type);

                    //initialize the provider with the saved card config
                    const cardProvider = new Provider(providerModel.config);
                    
                    const cards = await cardProvider.getCards();
                    for (let card of cards) {
                        const cardModel = new FeedItem({
                            ...card,
                            order: order(card),
                            expiration: new Date(new Date() + config.expiration)
                        });
                        await cardModel.save();
                    }
                }
            }
            
            const { page } = req.query;
            res.send(await FeedItem.paginate({ expiration: { $lte: new Date() } }, { page, sort: { order: -1 } }));
        }

        catch (ex) {
            next(ex);
        }
    }

    async putProvider(req, res, next) {
        try {
            // todo 'type' param validation
            // todo check if provider type is in providerMap

            const { type, config } = req.body,
                { _id: client } = req.client;
            
            if(!await Provider.find({ type, config }).count()) {
                const provider = new Provider({
                    type,
                    config
                });
                await provider.save();
            }
            
            const {_id: provider } = await Provider.findOne({ type, config });
            if(await ClientProvider.findOne({ provider, client })) {
                return res.status(409).send({
                    error: 'Provider was already added'
                });
            }
            
            const clientProvider = new ClientProvider({
                provider,
                client 
            });
            await clientProvider.save();
            
            res.status(201).send(emoji.the_horns);
        }
        catch (ex) {
            next(ex);
        }
    }
}