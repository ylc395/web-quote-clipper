export enum Colors {
  Yellow = 'YELLOW',
  Green = 'GREEN',
  Blue = 'BLUE',
  Pink = 'PINK',
  Purple = 'PURPLE',
}

export interface Quote {
  sourceUrl: string;
  locators: [string, string];
  contents: string[];
  pureTextContents?: string[];
  comment: string;
  color: Colors;
  note?: Note;
}

export interface Note {
  content?: string;
  id: string;
  path?: string;
}
