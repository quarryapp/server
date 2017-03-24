// @flow

import config from './config.json';
import { emoji } from 'node-emoji';
import logger from './logger';
import sort from './services/sort';
import chalk from 'chalk';
import moment from 'moment';

import Feedly from './providers/Feedly';
import ProductHunt from './providers/ProductHunt';
import GitHub from './providers/GitHub';
import DesignerNews from './providers/DesignerNews';
import Reddit from './providers/Reddit';

class POC {
    constructor() {
        logger.info(`huntr.${emoji.cool}`);
        this.GoOOOOoOOOoOOoOoOooOooOoo()
            .catch(err => logger.error(err));
    }
    
    async GoOOOOoOOOoOOoOoOooOooOoo() {
        const providerTypes = [
            Feedly,
            ProductHunt,
            GitHub,
            DesignerNews,
            Reddit
        ];

        const providerMap = new Map();
        for(let provider of providerTypes) {
            providerMap.set(provider.type, provider);
        }
        
        // will contain all initialized providers
        const availableProviders = [];

        // config would be loaded from chrome sync, some backend, whatever.
        // for now just static tho
        for(let cardConfig of config) {
            if(providerMap.has(cardConfig.type)) {
                const Provider = providerMap.get(cardConfig.type);

                //initialize the provider with the saved card config
                const cardProvider = new Provider(cardConfig);
                availableProviders.push(cardProvider);
            }
        }

        let cards = [];
        for(let provider of availableProviders) {
            try {
                cards = [...cards, ...await provider.getCards()];
            } catch(ex) {
                logger.error(`${provider.name} failed:`, ex);
            }
        }

        for(let [index, card] of sort(cards).entries()) {
            logger.debug(`#${index + 1}: ${chalk.green(card.name)} - ${chalk.yellow(card.title)} (m: ${chalk.gray(card.sort)}, s: ${chalk.gray(card.score)} t: ${chalk.gray(moment(card.timestamp).fromNow())})`);
        }
    }
}

export default new POC();