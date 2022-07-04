import 'reflect-metadata';
import { container } from 'tsyringe';
import { storageToken, databaseToken } from 'model/index';
import QuoteService from 'service/QuoteService';
import Joplin from '../joplin';
import Storage from './helper/Storage';
import { Message, MessageEvents } from '../types';
import { imgSrcToDataUrl } from './helper';

container.registerSingleton(storageToken, Storage);
container.registerSingleton(databaseToken, Joplin);

const dataService = new QuoteService();

chrome.runtime.onMessage.addListener((message: Message, sender, sendBack) => {
  switch (message.event) {
    case MessageEvents.Captured:
      dataService.createQuote(message.payload).then(() => sendBack(true));
      break;
    case MessageEvents.Request:
      dataService.getAllQuotes().then(sendBack);
      break;
    case MessageEvents.GetDataUrl:
      imgSrcToDataUrl(message.payload).then(sendBack);
      break;
    default:
      break;
  }

  return true;
});
