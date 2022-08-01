import { container } from 'tsyringe';
import { storageToken, databaseToken, DbTypes } from 'model/db';
import QuoteService from 'service/QuoteService';
import ConfigService from 'service/ConfigService';
import { BrowserQuoteDatabase, BrowserStorage } from 'driver/browserStorage';
import Joplin from '../joplin';

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

  const quoteService = container.resolve(QuoteService);
  cb({ configService, quoteService });
}
