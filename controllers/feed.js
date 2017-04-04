// @flow

import { Router } from 'express';
import Client from '../models/client';
import Provider from '../models/provider';
import FeedItem from '../models/feeditem';
import logger from '../logger';
import providerTypes from '../providers';
import config from '../config.json';
import { emoji } from 'node-emoji';
import sort from '../services/sort';

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
            const query = { owner: req.client._id, expiration: { $lte: new Date() } },
                { _id: owner } = req.client;
            
            if(await FeedItem.find(query).count() === 0) {
                logger.debug(`Generating a new feed for client ${req.client.id.toString()}`);
                
                // will contain all initialized providers
                const availableProviders = [];

                const cardTypes = await Provider.find({ owner });

                for (let card of cardTypes) {
                    if (this.providerMap.has(card.type)) {
                        const Provider = this.providerMap.get(card.type);

                        //initialize the provider with the saved card config
                        const cardProvider = new Provider(card.config);
                        availableProviders.push(cardProvider);
                    }
                }

                let cards = [];
                for (let provider of availableProviders) {
                    try {
                        cards = [...cards, ...await provider.getCards()];
                    } catch (ex) {
                        logger.error(`${provider.name} failed:`, ex);
                    }
                }

                for (let [index, card] of sort(cards).entries()) {
                    const cardModel = new FeedItem({
                        ...card,
                        owner,
                        rank: index + 1,
                        expiration: new Date(new Date() + config.expiration)
                    });
                    await cardModel.save();
                }
            }

            const { page } = req.query;
            res.send(await FeedItem.paginate(query, { page, sort: { rank: 1 } }));
        }

        catch (ex) {
            next(ex);
        }
    }
    
    async putProvider(req, res, next) {
        try {
            // todo 'type' param validation
            // todo check if provider type is in providerMap
            
            const { type } = req.body;
            const provider = new Provider({
                type,
                owner: req.client._id
            });
            await provider.save();
            res.status(201).send(emoji.the_horns);
        }
        catch(ex) {
            next(ex);
        }
    }
}