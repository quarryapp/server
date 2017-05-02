// @flow

import type { Card } from '../entities';
import moment from 'moment';

export default class ProductHunt {
    static type = 'producthunt';
    name = 'ProductHunt';
    
    async getCards(): Promise<Card[]> {
        const resp = await fetch('https://api.producthunt.com/v1/posts?access_token=dc7c32494478755134d0119a32ab620828ca7eea2b4b26f4e272b2472ac8680b'),
            body = await resp.json();

        const { posts } = body;
        let cards = [];
        for(let [index, post] of posts.entries()) {
            let size = 'small';
            if(index < 2) {
                size = 'medium';
            }
            
            const card: Card = {
                type: ProductHunt.type,
                size,
                ranking: index + 1,
                url: post.redirect_url, 
                name: this.name,
                score: post.votes_count,
                timestamp: +moment(post.created_at),
                title: post.name,
                data: {
                    ...post
                }
            };
            cards.push(card);
        }
        
        return cards;
    }
}