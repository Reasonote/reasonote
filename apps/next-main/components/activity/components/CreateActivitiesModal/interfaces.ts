export interface AnkiCard {
    id: string | number;
    front: string;
    back: string;
}

export interface AnkiDeck {
    id: string | number;
    name: string;
    cards: AnkiCard[];
}