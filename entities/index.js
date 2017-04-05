export type Card = Provider & {
    score: number,
    timestamp: number, // publication date
    title: string, // title
    data: any // element specific data (will be passed as props to element)
};

export type Provider = {
    type: string,
    name: string, // provider name (can by dynamic, though)
    getCards: () => {}
};