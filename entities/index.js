import type { Element } from 'react';

export type Card = Provider & {
    type: string, // provider type
    element: Element[], // element responsible for rendering this card
    weight: number, // 0-10 (10 being most important)
    timestamp: number, // publication date
    title: string, // title
    data: any // element specific data (will be passed as props to element)
};

export type Provider = {
    type: string,
    name: string, // provider name (can by dynamic, though)
    getCards: () => {}
};