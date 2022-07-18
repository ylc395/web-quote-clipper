export enum Colors {
  Yellow = 'YELLOW',
  Green = 'GREEN',
  Blue = 'BLUE',
  Pink = 'PINK',
  Purple = 'PURPLE',
}

export interface Quote {
  sourceUrl: string;
  contents: string[];
  comment: string;
  color: Colors;
  createdAt: number;
  note?: Note;
}

export interface Note {
  content?: string;
  id: string;
  path?: string;
}
