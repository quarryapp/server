// @flow

import Feedly from './providers/Feedly';
import config from './config.json';
import { emoji } from 'node-emoji';
import logger from './logger';
import sort from './services/sort';
import chalk from 'chalk';
import moment from 'moment';

class POC {
    constructor() {
        logger.info(`huntr.${emoji.cool}`);
        this.GoOOOOoOOOoOOoOoOooOooOoo()
            .catch(err => logger.error(err));
    }
    
    async GoOOOOoOOOoOOoOoOooOooOoo() {
        const providerTypes = [
            Feedly
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

        cards = sort(cards);

        for(let [index, card] of cards.entries()) {
            logger.debug(`#${index + 1}: ${chalk.green(card.name)} - ${chalk.yellow(card.title)} (w: ${chalk.gray(card.weight)}, f: ${chalk.gray(card.freshness)} t: ${chalk.gray(moment(card.timestamp).fromNow())})`);
        }
    }
}

export default new POC();