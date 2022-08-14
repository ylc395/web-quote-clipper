import EventEmitter from 'eventemitter3';
import { container, singleton } from 'tsyringe';
import { DbTypes, isNoteFinder, noteFinderToken } from 'model/db';

export enum NoteEvents {
  TypeChanged = 'TYPE_CHANGED',
}

@singleton()
export default class NoteService extends EventEmitter {
  private notesFinder = container.resolve(noteFinderToken);

  searchNotes = async (keyword: string, isId = false) => {
    if (!isNoteFinder(this.notesFinder)) {
      throw new Error('can not search notes');
    }

    return isId
      ? [await this.notesFinder.getNoteById(keyword)]
      : this.notesFinder.searchNotes(keyword);
  };

  setNotesFinder = async (type: DbTypes) => {
    this.emit(NoteEvents.TypeChanged, type);
    this.notesFinder = container.resolve(noteFinderToken);
  };
}
