/**
 * Created by Jari on 23/03/2017.
 */
import type { Card } from '../entities/index';

export default (cards: Card[]) => {
    return cards
        .map(card => {
            const now = +new Date(), _24hours = (60 * 1000 * 60 * 24), elapsed = now - _24hours;;
            
            // calculate 'freshness', a 0 to 10 value indicating how new this card is.
            // cards older than 24 hours will have negative freshness, this is by design.
            card.freshness = (card.timestamp - elapsed) / _24hours * 10;
            
            return card;
        })
        .sort((a: Card, b: Card) => {
            return ((b.weight + b.freshness) - (a.weight + a.freshness));
        });
}