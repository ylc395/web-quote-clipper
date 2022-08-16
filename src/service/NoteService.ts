import EventEmitter from 'eventemitter3';
import { container, singleton } from 'tsyringe';
import { DbTypes, isNoteFinder, noteFinderToken, NotesFinder } from 'model/db';
import type { Note } from 'model/entity';

export enum NoteEvents {
  TypeChanged = 'TYPE_CHANGED',
}

@singleton()
export default class NoteService extends EventEmitter {
  private notesFinder?: NotesFinder;
  private type?: DbTypes;

  searchNotes = (type: DbTypes, keyword: string, isId = false) => {
    this.setType(type);

    if (!isNoteFinder(this.notesFinder)) {
      throw new Error('can not search notes');
    }

    const search = isId
      ? this.notesFinder.getNoteById(keyword)
      : this.notesFinder.searchNotes(keyword);

    return new Promise<Note[]>((resolve, reject) => {
      search.then(
        (result) => resolve(Array.isArray(result) ? result : [result]),
        reject,
      );
      setTimeout(reject, 2000);
    });
  };

  private setType = (type: DbTypes) => {
    if (type !== this.type) {
      this.notesFinder?.destroy();
      this.emit(NoteEvents.TypeChanged, type);
      this.notesFinder = container.resolve(noteFinderToken);
      this.type = type;
    }
  };

  destroy = () => {
    this.notesFinder?.destroy();
    this.type = undefined;
    this.notesFinder = undefined;
  };
}
