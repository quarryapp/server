// @flow

import type { Card } from '../entities';
import moment from 'moment';
import logger from '../logger';
import chalk from 'chalk';
import throwIfNotOK from '../services/throwIfNotOK';

export default class Dribbble {
    static type = 'dribbble';
    name = 'Dribbble';
    
    async getCards(amount: number = 10): Promise<Card[]> {
        const resp = await fetch(`https://api.dribbble.com/v1/shots?page=1&access_token=74f8fb9f92c1f79c4bc3662f708dfdce7cd05c3fc67ac84ae68ff47568b71a1f&per_page=${amount}`);
        throwIfNotOK(resp);
        const body = await resp.json();

        let cards = [];
        for(let [index, post] of body.entries()) {
            let size = 'small';
            if(index < 4) {
                size = 'large';
            }
            
            // dribbble does something weird here, it basically gives us a list of what was trending yesterday.
            // our algorithm does not like that, at all, and will rank all dribbble entries very low because of this.
            // this forces us to play around with the timestamps a little; we'll divide the difference from now by 3
            const realDate = moment(post.created_at);
            const now = moment();
            const date = moment(+now - now.diff(realDate) / 3);
            
            const card: Card = {
                type: Dribbble.type,
                name: this.name,
                url: post.html_url,
                ranking: index + 1,
                size,
                score: post.likes_count,
                timestamp: +moment(date),
                title: post.title,
                data: {
                    realTimestamp: +moment(post.created_at),
                    images: post.images,
                    animated: post.animated
                }
            };
            cards.push(card);
            
            logger.debug(card.title, chalk.yellow(moment(card.timestamp).fromNow()), chalk.green(card.score));
        }
        
        return cards;
    }
}