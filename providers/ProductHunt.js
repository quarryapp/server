// @flow

import type { Card } from '../entities';
import moment from 'moment';
import { URL } from 'url';
import path from 'path';
import throwIfNotOK from '../services/throwIfNotOK';
import rehostImage from '../services/rehostImage';

const PRODUCTHUNT_ASSET_BASE = 'https://ph-files.imgix.net/';

export default class ProductHunt {
    static type = 'producthunt';
    name = 'ProductHunt';
    
    async getCards(amount: number = 10): Promise<Card[]> {
        const resp = await fetch('https://api.producthunt.com/v1/posts?access_token=dc7c32494478755134d0119a32ab620828ca7eea2b4b26f4e272b2472ac8680b'),
            body = await resp.json();

        const { posts } = body;
        let cards = [], promises = [];
        
        for(let [index, post] of posts.entries()) {
            if(index + 1 > amount) {
                break;
            }
            
            const promise = async() => {
                const slug = path.basename(new URL(post.discussion_url).pathname);
                const resp = await fetch('https://www.producthunt.com/frontend/posts/' + slug);
                throwIfNotOK(resp);
                const { post: postDetails } = await resp.json(); 
                
                // logger.debug(postDetails);
                
                const images = postDetails.media.filter(media => media.media_type === 'image');
                
                let imageUrl, imageType;
                
                if(postDetails.header_media_id) {
                    const image = images.find(({ id }) => id === postDetails.header_media_id);
                    if(image) {
                        imageUrl = PRODUCTHUNT_ASSET_BASE + image.image_uuid;
                        imageType = 'header';
                    }
                } else {
                    if(images.length) {
                        // grab second, otherwise, first.
                        imageUrl = PRODUCTHUNT_ASSET_BASE + images[images.length > 1 ? 1 : 0].image_uuid;
                        imageType = 'mediaImage';
                    } else {
                        // fall back to screenshot (if available)
                        if(post.screenshot_url && Object.keys(post.screenshot_url).length) {
                            imageUrl = post.screenshot_url[Object.keys(post.screenshot_url).reverse()[0]];
                            imageType = 'screenshot';
                        }
                    }
                }
                
                let size = 'small';
                if(index < 2) {
                    size = 'medium';
                }
                
                let thumbUrl;
                
                if(imageUrl) {
                    thumbUrl = imageUrl + '?auto=format&frame=1&fit=crop&h=10&w=10';
                    imageUrl = await rehostImage(imageUrl);
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
                        tagline: post.tagline,
                        image: imageUrl,
                        thumb: imageUrl ? thumbUrl : null,
                        imageType
                    }
                };
                cards.push(card);
            };
            
            promises.push(promise());
        }
        
        await Promise.all(promises);
        
        return cards;
    }
}