import { container } from 'tsyringe';
import {
  storageToken,
  databaseToken,
  DbTypes,
  noteFinderToken,
} from 'model/db';
import QuoteService from 'service/QuoteService';
import ConfigService, { ConfigEvents } from 'service/ConfigService';
import NoteService, { NoteEvents } from 'service/NoteService';
import { BrowserQuoteDatabase, BrowserStorage } from 'driver/browserStorage';
import Joplin from '../joplin';
import type { AppConfig } from 'model/config';

container.register(storageToken, { useValue: new BrowserStorage('local') });

const DbMap = {
  [DbTypes.Browser]: BrowserQuoteDatabase,
  [DbTypes.Joplin]: Joplin,
} as const;

export default async function bootstrap(
  cb: (services: {
    quoteService: QuoteService;
    configService: ConfigService;
    noteService: NoteService;
  }) => void,
) {
  const configService = container.resolve(ConfigService);
  const dbType = await configService.get('db');

  container.registerSingleton(databaseToken, DbMap[dbType]);
  configService.on(ConfigEvents.Updated, (patch: Partial<AppConfig>) => {
    if (patch.db) {
      const db = container.resolve(databaseToken);
      db.destroy();
      container.registerSingleton(databaseToken, DbMap[patch.db]);
    }
  });

  const noteService = container.resolve(NoteService);
  noteService.on(NoteEvents.TypeChanged, (type: DbTypes) => {
    if (type === DbTypes.Joplin) {
      container.registerSingleton(noteFinderToken, Joplin);
    } else {
      container.register(noteFinderToken, { useFactory: () => undefined });
    }
  });

  const quoteService = container.resolve(QuoteService);

  cb({ configService, quoteService, noteService });
}
