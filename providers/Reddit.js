// @flow

import type { Card } from '../entities';
import moment from 'moment';
import isImageUrl from '../services/isImageUrl';

export default class Reddit {
    static type = 'reddit';
    name = 'Reddit';
    feedUrl = '';

    async getCards(amount: number = 10): Promise<Card[]> {
        const resp = await fetch(`https://www.reddit.com/r/all.json?limit=${amount}`),
            { data: { children } } = await resp.json();

        let cards = [];
        for(let [index, child] of children.entries()) {
            const { data } = child;
            let size = 'small';
            if(isImageUrl(data.url)) {
                size = 'medium';
                if(index < 2) {
                    size = 'large';
                }
            } else {
                if(index < 2) {
                    size = 'medium';
                }
            }
            
            const card: Card = {
                type: Reddit.type,
                url: data.url,
                size,
                ranking: index + 1, 
                name: this.name,
                score: data.score,
                timestamp: data.created_utc * 1000,
                title: data.title,
                data: {
                    ...data
                }
            };
            cards.push(card);
        }
        
        return cards;
    }
}