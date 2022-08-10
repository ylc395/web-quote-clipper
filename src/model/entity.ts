export enum Colors {
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue',
  Pink = 'pink',
  Purple = 'purple',
}

export const COLORS = [
  Colors.Yellow,
  Colors.Green,
  Colors.Blue,
  Colors.Pink,
  Colors.Purple,
];

export interface Quote {
  id: string;
  sourceUrl: string;
  contents: string[];
  comment: string;
  color: Colors;
  createdAt: number;
  note?: Note;
}

export interface Note {
  content?: string;
  path: string;
  id: string;
}
