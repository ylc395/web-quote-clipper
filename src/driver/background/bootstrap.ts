import { container } from 'tsyringe';
import { storageToken, databaseToken } from 'model/db';
import QuoteService from 'service/QuoteService';
import ConfigService, { DbTypes } from 'service/ConfigService';
import { BrowserQuoteDatabase, BrowserStorage } from 'driver/browserStorage';
import Joplin from '../joplin';

export default async function bootstrap(
  cb: (services: {
    quoteService: QuoteService;
    configService: ConfigService;
  }) => void,
) {
  container.registerSingleton(storageToken, BrowserStorage);

  const configService = container.resolve(ConfigService);
  const dbType = await configService.get('db');

  switch (dbType) {
    case DbTypes.Browser:
      container.registerSingleton(databaseToken, BrowserQuoteDatabase);
      break;
    case DbTypes.Joplin:
      container.registerSingleton(databaseToken, Joplin);
      break;
    default:
      break;
  }

  const quoteService = container.resolve(QuoteService);

  cb({ configService, quoteService });
}
