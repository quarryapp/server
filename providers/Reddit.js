// @flow

import type { Card } from '../entities';
import React from 'react';
import moment from 'moment';

export default class Reddit {
    static type = 'reddit';
    name = 'Reddit';
    feedUrl = '';
    
    async getCards(amount=10): Promise<Card[]> {
        const resp = await fetch(`https://www.reddit.com/r/all.json?limit=${amount}`),
            { data: { children } } = await resp.json();

        let cards = [];
        for(let child of children) {
            const { data } = child;
            const card: Card = {
                type: Reddit.type,
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