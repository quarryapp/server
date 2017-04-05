import type { Card } from '../entities/index';

export default (card: Card) => {
    // this is a carbon board copy of reddit's hot sorting
    const order = Math.log10(Math.max(Math.abs(card.score), 1)),
        seconds = (card.timestamp / 1000) - 1134028003;
    let sign;

    if (card.score > 0) {
        sign = 1;
    } else if (card.score < 0) {
        sign = -1;
    } else {
        sign = 0;
    }
    return round(sign * order + seconds / 4500, 7);
};

const round = (value, exp) => {
    if (typeof exp === 'undefined' || +exp === 0)
        return Math.round(value);

    value = +value;
    exp = +exp;

    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}