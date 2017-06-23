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
import { Types } from 'mongoose';
import providers from '../providers';

export default class FeedController {
    router = Router();
    providerMap = new Map();

    constructor(app) {
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
        this.router.delete('/provider', this.deleteProvider.bind(this));
        this.router.get('/provider', this.getProvider.bind(this));
    }

    async getFeed(req, res, next) {
        try {
            const { _id: client } = req.client;
            
            req.checkQuery('page', 'Invalid page').optional().isInt({min: 1});

            const validationResult = await req.getValidationResult();

            if(!validationResult.isEmpty()) {
                return res.status(400).send({
                    errors: validationResult.array()
                });
            }
            
            const clientProviders = await ClientProvider.find({ client });
            for(let clientProvider of clientProviders) {
                const providerModel = await Provider.findOne({
                    _id: clientProvider.provider
                });
                
                if(!providerModel) {
                    throw new Error('ClientProvider used a non-existing Provider');
                }

                // todo better cache check... 
                // todo if a provider returns 0 cards this will cause the provider to get called every time we do a refresh.
                if (!await FeedItem.find({ expiration: { $gte: new Date() }, owner: providerModel._id }).count()) {
                    try {
                        logger.debug(`Fetching new feed provider ${providerModel.type} (config: ${JSON.stringify(providerModel.config)})`);

                        const Provider = this.providerMap.get(providerModel.type);

                        if(!Provider) {
                            throw new Error('Attempted to load a non-existing provider from database into memory!');
                        }

                        //initialize the provider
                        const cardProvider = new Provider(providerModel);

                        // todo: Promise.all()
                        const cards = await cardProvider.getCards();
                        for (let card of cards) {
                            const cardModel = new FeedItem({
                                ...card,
                                owner: providerModel._id,
                                order: order(card),
                                expiration: new Date(+(new Date()) + config.expiration)
                            });
                            await cardModel.save();
                        }
                    }
                    catch(ex) {
                        logger.error(`Failed getting ${providerModel.type} (config: ${JSON.stringify(providerModel.config)})`, ex);
                        continue;
                    }
                    
                }
            }
            
            const { page } = req.query;
            res.send(await FeedItem.paginate({
                owner: { $in: clientProviders.map(cP => cP.provider) },
                expiration: { $gte: new Date() }
            }, { 
                limit: 25,
                page, 
                sort: { order: -1 } 
            }));
        }

        catch (ex) {
            next(ex);
        }
    }
    
    async deleteProvider(req, res, next) {
        try {
            const ERR_MSG = 'Invalid provider ID';
            req.checkBody('id', ERR_MSG).isMongoId();

            const validationResult = await req.getValidationResult();
            if(!validationResult.isEmpty()) {
                return res.status(400).send({
                    errors: validationResult.array()
                });
            }

            const { id } = req.body, { _id: client } = req.client;
            
            const cP = await ClientProvider.findOne({
                _id: new Types.ObjectId(id),
                client
            });
            
            if(!cP) {
                return res.status(400).send({
                    errors: [{
                        param: 'id',
                        msg: ERR_MSG,
                        value: req.body.id
                    }]
                });
            }
            
            await cP.remove();
            res.status(200).send(emoji.the_horns);
        } catch(ex) {
            next(ex);
        }
    }
    
    async getProvider(req, res, next) {
        try {
            const clientProviders = await ClientProvider.find({client: req.client._id}).lean();
            
            let providers = [];
            for(let clientProvider of clientProviders) {
                const provider = await Provider.findOne({_id: clientProvider.provider}).lean();
                
                //clean up response
                delete clientProvider.client;
                delete clientProvider.provider;
                delete clientProvider.__v;
                delete provider.__v;
                
                providers = [...providers, {
                    ...provider,
                    ...clientProvider
                }];
            }
            res.status(200).send(providers);
        } catch(ex) {
            next(ex);
        }
    }

    async putProvider(req, res, next) {
        try {
            req.checkBody('type', 'Invalid provider type supplied').isAlpha().isValidProvider();
            req.checkBody('config', 'Invalid provider config supplied').isValidConfig(req.body.type);
            
            const validationResult = await req.getValidationResult();
            if(!validationResult.isEmpty()) {
                return res.status(400).send({
                    errors: validationResult.array()
                });
            }
            
            // todo better naming!!! holy shit
            let data = null;
            const ProviderInstance = providers.find((provider: Provider) => req.body.type === provider.type);
            const providerInstance = new ProviderInstance(req.body);
            if('getData' in providerInstance) {
                data = await providerInstance.getData();
            }

            const { type, config } = req.body,
                { _id: client } = req.client;
            
            if(!await Provider.find({ type, config }).count()) {
                const provider = new Provider({
                    type,
                    config,
                    data
                });
                await provider.save();
            }
            
            const {_id: provider } = await Provider.findOne({ type, config });
            if(await ClientProvider.findOne({ provider, client })) {
                return res.status(409).send({
                    errors: [{
                        msg: 'Provider was already added.',
                    }]
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