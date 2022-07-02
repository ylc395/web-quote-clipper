import 'reflect-metadata';
import { container } from 'tsyringe';
import { storageToken, databaseToken } from 'model/index';
import QuoteService from 'service/QuoteService';
import Joplin from '../joplin';
import Storage from './helper/Storage';
import { Message, MessageEvents } from '../types';

container.registerSingleton(storageToken, Storage);
container.registerSingleton(databaseToken, Joplin);

const dataService = new QuoteService();

chrome.runtime.onMessage.addListener((message: Message) => {
  switch (message.event) {
    case MessageEvents.Captured:
      return dataService.createQuote(message.payload);
    default:
      break;
  }
});
