// @flow

import type { Card } from '../entities';
import React from 'react';
import moment from 'moment';
import logger from '../logger';

// todo rewrite with github-trending

export default class GitHub {
    static type = 'github';
    name = 'GitHub';
    feedUrl = '';
    
    async getCards(): Promise<Card[]> {
        const url = `https://api.github.com/search/repositories?q=created:>=${moment().subtract(1, 'day').format('YYYY-MM-DD')}&sort=stars&order=desc`
        // logger.debug(url);
        const resp = await fetch(url),
            body = await resp.json();

        const { items } = body;
        let cards = [];
        for(let item of items) {
            const card: Card = {
                type: GitHub.type,
                name: this.name,
                element: <div></div>, // this will contain a react element later on....
                score: item.stargazers_count,
                timestamp: +moment(item.created_at),
                title: item.full_name,
                data: {
                    ...item
                }
            };
            cards.push(card);
        }
        
        return cards;
    }
}