import 'reflect-metadata';
import { container } from 'tsyringe';
import { storageToken, databaseToken } from 'model/db';
import QuoteService from 'service/QuoteService';
import Joplin from '../joplin';
import { Message, MessageEvents, Response } from '../message';
import { imgSrcToDataUrl, BrowserStorage } from './helper';

container.registerSingleton(storageToken, BrowserStorage);
container.registerSingleton(databaseToken, Joplin);

const dataService = new QuoteService();

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendBack: (payload: Response) => void) => {
    const success = (res: unknown) => sendBack({ res });
    const fail = (err: unknown) =>
      sendBack({ err: err instanceof Error ? err.message : err });

    switch (message.event) {
      case MessageEvents.CreateQuote:
        dataService.createQuote(message.payload).then(success, fail);
        return true;
      case MessageEvents.RequestQuotes:
        dataService.fetchQuotes(message.payload).then(success, fail);
        return true;
      case MessageEvents.GetDataUrl:
        imgSrcToDataUrl(message.payload).then(success, fail);
        return true;
      default:
        return true;
    }
  },
);
