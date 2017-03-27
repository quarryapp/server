// @flow

import type { Card } from '../entities';
import React from 'react';
import moment from 'moment';

export default class DesignerNews {
    static type = 'designernews';
    name = 'DesignerNews';
    feedUrl = '';
    
    async getCards(amount=10): Promise<Card[]> {
        const resp = await fetch(`https://api.designernews.co/api/v2/stories/?limit=${amount}`),
            body = await resp.json();

        const { stories } = body;
        let cards = [];
        for(let story of stories) {
            const card: Card = {
                type: DesignerNews.type,
                name: this.name,
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