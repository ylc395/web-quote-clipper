import { container } from 'tsyringe';
import { storageToken, databaseToken, DbTypes } from 'model/db';
import QuoteService from 'service/QuoteService';
import ConfigService, { ConfigEvents } from 'service/ConfigService';
import { BrowserQuoteDatabase, BrowserStorage } from 'driver/browserStorage';
import Joplin from '../joplin';
import type { AppConfig } from 'model/config';

container.registerSingleton(storageToken, BrowserStorage);

const DbMap = {
  [DbTypes.Browser]: BrowserQuoteDatabase,
  [DbTypes.Joplin]: Joplin,
} as const;

export default async function bootstrap(
  cb: (services: {
    quoteService: QuoteService;
    configService: ConfigService;
  }) => void,
) {
  const configService = container.resolve(ConfigService);
  const dbType = await configService.get('db');
  container.registerSingleton(databaseToken, DbMap[dbType]);

  configService.on(ConfigEvents.Updated, (patch: Partial<AppConfig>) => {
    if (patch.db) {
      container.registerSingleton(databaseToken, DbMap[patch.db]);
    }
  });

  const quoteService = container.resolve(QuoteService);
  cb({ configService, quoteService });
}
