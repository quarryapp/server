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
        const resp = await fetch(`https://feedly.com/v3/streams/contents?streamId=${encodeURI(this.feedUrl)}&count=${amount}&hours=24&similar=true&ck=1490204582101&ct=feedly.desktop&cv=30.0.1310`);
        throwIfNotOK(resp);
        const body = await resp.json();

        const { items, direction } = body;
        let cards = [];
        for (let [index, item] of items.entries()) {
            let size = 'small';
            if(index < 2) {
                size = 'medium';
            }
            
            let { visual } = item, content = null;
            
            // perferably we use the summary, else we'll use the content as fallback
            if(item.summary) {
                content = item.summary;
            } else if(item.content) {
                content = item.content;
            }
            
            // normalize weird feedly fields
            if(visual && visual.url === 'none') {
                visual.url = null;
            }
            
            const card: Card = {
                type: Feedly.type,
                name: this.name || body.title,
                size,
                ranking: index + 1,
                score: item.engagement,
                url: item.originId,
                timestamp: item.published,
                title: item.title,
                data: {
                    direction,
                    content,
                    visual
                }
            };
            cards.push(card);
        }

        return cards;
    }
}