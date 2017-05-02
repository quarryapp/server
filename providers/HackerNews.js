// @flow

import type { Card } from '../entities';
import moment from 'moment';

export default class HackerNews {
    static type = 'hackernews';
    name = 'HackerNews';
    
    async getCards(): Promise<Card[]> {
        const resp = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page'),
            body = await resp.json();

        const { hits } = body;
        let cards = [];
        for(let [index, post] of hits.entries()) {
            let size = 'small';
            if(index < 2) {
                size = 'medium';
            }
            
            const card: Card = {
                type: HackerNews.type,
                name: this.name,
                url: post.url,
                size,
                score: post.points,
                timestamp: +moment(post.created_at),
                title: post.title,
                data: {
                    ...post
                }
            };
            cards.push(card);
        }
        
        return cards;
    }
}