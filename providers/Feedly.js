// @flow

import type { Card } from '../entities';
import React from 'react';

export default class Feedly {
    static type = 'feedly';
    name = '';
    feedUrl = '';
    
    constructor({feedUrl, name}) {
        this.name = name;
        this.feedUrl = feedUrl;
    }
    
    async getCards(amount=25): Promise<Card[]> {
        // fyi error handling gets handled by callee
        
        // todo think about continuation (some platforms use pages, others - like feedly - use continuation thingies)
        const resp = await fetch(`https://feedly.com/v3/streams/contents?streamId=${encodeURI(this.feedUrl)}&count=${amount}&ranked=newest&similar=true&ck=1490204582101&ct=feedly.desktop&cv=30.0.1310`),
            body = await resp.json();

        const { items } = body;
        let cards = [];
        for(let item of items) {
            const card: Card = {
                type: Feedly.type,
                name: this.name,
                element: <div></div>, // this will contain a react element later on....
                weight: item.engagementRate,
                timestamp: item.published,
                title: item.title,
                data: {
                    item
                }
            };
            cards.push(card);
        }
        
        return cards;
    }
}