export type Card = {
    type: string,
    name: string,
    ranking: number, // the original ranking by source itself
    size: 'small' | 'medium' | 'large',
    score: number,
    timestamp: number, // publication date
    title: string, // title
    data: any // element specific data (will be passed as props to element)
};

export type Provider = {
    type: string,
    name: string, // provider name (can by dynamic, though)
    getCards: Function,
    validateConfig: Function
};