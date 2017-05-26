// @flow

import type { Card } from '../entities';
import throwIfNotOK from '../services/throwIfNotOK';
import isEqual from 'lodash/isEqual';
import isUrl from 'validator/lib/isUrl';
import logger from '../logger';
import { extension } from 'mime-types';
import fs from 'fs';
import * as path from 'path';
import appConfig from '../config.json';

type FeedlyConfig = {
    feedUrl: string
};

type FeedlyData = {
    iconUrl?: string,
    logoUrl?: string
}

const FEEDLY_SEARCH_URL = (feedUrl: string) => `https://feedly.com/v3/search/feeds?q=${encodeURIComponent(feedUrl)}&n=1&fullTerm=false&organic=true&promoted=true&locale=en&ck=1494109051099&ct=feedly.desktop&cv=30.0.1324`;
const FEEDLY_STREAM_URL = (feedUrl: string, amount: number) => `https://feedly.com/v3/streams/contents?streamId=${encodeURI(feedUrl)}&count=${amount}&hours=24&similar=true&ck=1490204582101&ct=feedly.desktop&cv=30.0.1310`;

export default class Feedly {
    static type = 'feedly';
    static async validateConfig(config: FeedlyConfig) {
        logger.debug('feedly validateConfig', typeof config, config);
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
        
        const response = await fetch(FEEDLY_SEARCH_URL(config.feedUrl));
        if(!response.ok) {
            return false;
        }
        const { results } = await response.json();
        if(!results.length) {
            return false;
        }
        
        return true;
    }
    
    async _rehostLogo(url: string): Promise<string> {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');
        const ext = extension(contentType);
        logger.debug(contentType, ext);
        const filename = path.basename(url, ext) + '.' + ext;
        const dest = fs.createWriteStream(`${__dirname}/../public/cdn/${filename}`);
        response.body.pipe(dest);
        return appConfig.url + 'cdn/' + filename;
    }

    async getData(): FeedlyData {
        const response = await fetch(FEEDLY_SEARCH_URL(this.feedUrl));
        throwIfNotOK(response);
        const { results } = await response.json();

        let { logo, wordmark, visualUrl, iconUrl } = results[0];
        let logoUrl = logo || wordmark || visualUrl || null;
        
        if(logoUrl) {
            logoUrl = await this._rehostLogo(logoUrl);
        }
        if(iconUrl) {
            iconUrl = await this._rehostLogo(iconUrl);
        }
        
        return {
            iconUrl,
            logoUrl
        };
    }
    
    
    name = '';
    feedUrl = '';
    data: ?FeedlyData = null;

    constructor({ config: { feedUrl }, name, data }: { config: FeedlyConfig, name: string, data: FeedlyData }) {
        this.name = name;
        this.feedUrl = feedUrl;
        this.data = data;
    }

    async getCards(amount: number = 10): Promise<Card[]> {
        const resp = await fetch(FEEDLY_STREAM_URL(this.feedUrl, amount));
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
            
            let logoUrl, iconUrl;
            if(this.data) {
                logoUrl = this.data.logoUrl;
                iconUrl = this.data.iconUrl;
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
                    visual,
                    logoUrl,
                    iconUrl
                }
            };
            cards.push(card);
        }

        return cards;
    }
}