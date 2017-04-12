// @flow

import type { Card } from '../entities';
import throwIfNotOK from '../services/throwIfNotOK';
import isEqual from 'lodash/isEqual';
import isUrl from 'validator/lib/isUrl';
import logger from '../logger';

type FeedlyConfig = {
    feedUrl: string
};

export default class Feedly {
    static type = 'feedly';
    static validateConfig(config: FeedlyConfig) {
        logger.debug('feedly validateConfig', config);
        if(typeof config !== 'object') {
            return false;
        }
        
        if (!isEqual(['feedUrl'], Object.keys(config))) {
            return false;
        }

        if (config.feedUrl.substring(0, 5) !== 'feed/') {
            return false;
        }

        if (!isUrl(config.feedUrl.substring(5))) {
            return false;
        }

        return true;
    }
    
    
    name = '';
    feedUrl = '';

    constructor({ config: { feedUrl }, name }: { config: FeedlyConfig, name: string }) {
        this.name = name;
        this.feedUrl = feedUrl;
    }

    async getCards(amount: number = 10): Promise<Card[]> {
        // todo think about continuation (some platforms use pages, others - like feedly - use continuation thingies)
        const resp = await fetch(`https://feedly.com/v3/streams/contents?streamId=${encodeURI(this.feedUrl)}&count=${amount}&ranked=newest&similar=true&ck=1490204582101&ct=feedly.desktop&cv=30.0.1310`);
        throwIfNotOK(resp);
        const body = await resp.json();

        const { items } = body;
        let cards = [];
        for (let item of items) {
            const card: Card = {
                type: Feedly.type,
                name: this.name || body.title,
                score: Math.round(item.engagementRate * 100),
                timestamp: item.published,
                title: item.title,
                data: {
                    ...item
                }
            };
            cards.push(card);
        }

        return cards;
    }
}