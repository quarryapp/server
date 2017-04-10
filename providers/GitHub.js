// @flow

import type { Card } from '../entities';
import moment from 'moment';
import cheerio from 'cheerio';
import chance from 'chance';

// todo rewrite with github-trending

export default class GitHub {
    static type = 'github';
    name = 'GitHub';
    feedUrl = '';

    async getCards(): Promise<Card[]> {
        // why doesn't this have an api?!

        const resp = await fetch('https://github.com/trending'),
            $ = cheerio.load(await resp.text());

        let cards = [];
        for (let child of $('.repo-list li').get()) {
            const name = $(child).find('h3 > a').first().attr('href').substring(1),
                hour = 60 * 1000 * 60,
                score = $(child).find('span.float-right').text().trim().split(' ')[0].replace(',', '');

            const date = moment()
                .hours(0)
                .minutes(0)
                .seconds(0)
                .add(chance(name).integer({ min: 0, max: hour * 24 }), 'milliseconds');

            const card: Card = {
                type: GitHub.type,
                name: this.name,
                score: score,
                // huntr's best kept secret: github dates are randomly generated using their name as seed.
                // why? there's no way to know when this repo started trending. srry!
                // todo randomize timestamp over current day
                timestamp: +date,
                title: name,
                data: {
                    description: $(child).find('.py-1 > .d-inline-block').text().trim(),
                    language: $(child).find('[itemprop="programmingLanguage"]').text().trim()
                }
            };
            cards.push(card);
        }

        return cards;
    }
}