import 'reflect-metadata';
import { container } from 'tsyringe';
import { storageToken, databaseToken } from 'model/index';
import QuoteService from 'service/QuoteService';
import Joplin from '../joplin';
import { Message, MessageEvents } from '../types';
import { imgSrcToDataUrl, BrowserStorage } from './helper';

container.registerSingleton(storageToken, BrowserStorage);
container.registerSingleton(databaseToken, Joplin);

const dataService = new QuoteService();

chrome.runtime.onMessage.addListener((message: Message, sender, sendBack) => {
  switch (message.event) {
    case MessageEvents.Captured:
      dataService.createQuote(message.payload).then(() => sendBack(true));
      break;
    case MessageEvents.Request:
      dataService.fetchQuotes(message.payload).then(sendBack);
      break;
    case MessageEvents.GetDataUrl:
      imgSrcToDataUrl(message.payload).then(sendBack);
      break;
    default:
      break;
  }

  return true;
});
