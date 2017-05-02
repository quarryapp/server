// @flow

import type { Card } from '../entities';
import moment from 'moment';

export default class DesignerNews {
    static type = 'designernews';
    name = 'DesignerNews';
    feedUrl = '';

    async getCards(amount: number = 10): Promise<Card[]> {
        const resp = await fetch(`https://api.designernews.co/api/v2/stories/?limit=${amount}`),
            body = await resp.json();
        
        const { stories } = body;
        let cards = [];
        for(let [index, story] of stories.entries()) {
            let size = 'small';
            if(index < 2 && !story.sponsored) {
                size = 'medium';
            }
            
            const card: Card = {
                type: DesignerNews.type,
                name: this.name,
                url: story.url,
                size,
                ranking: index + 1,
                score: story.vote_count,
                timestamp: +moment(story.created_at),
                title: story.title,
                data: {
                    ...story
                }
            };
            cards.push(card);
        }
        
        return cards;
    }
}