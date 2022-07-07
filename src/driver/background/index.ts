import 'reflect-metadata';
import { container } from 'tsyringe';
import { storageToken, databaseToken } from 'model/io';
import QuoteService from 'service/QuoteService';
import Joplin from '../joplin';
import { Message, MessageEvents } from '../message';
import { imgSrcToDataUrl, BrowserStorage } from './helper';

container.registerSingleton(storageToken, BrowserStorage);
container.registerSingleton(databaseToken, Joplin);

const dataService = new QuoteService();

chrome.runtime.onMessage.addListener((message: Message, sender, sendBack) => {
  switch (message.event) {
    case MessageEvents.CreateQuote:
      dataService.createQuote(message.payload).then(() => sendBack(true));
      break;
    case MessageEvents.RequestQuotes:
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
