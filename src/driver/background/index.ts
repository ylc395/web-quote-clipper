import 'reflect-metadata';
import { container } from 'tsyringe';
import { storageToken, databaseToken, CaptureEvents } from 'model/index';
import DataService from 'service/DataService';
import Joplin from '../joplin';
import Storage from './Storage';
import type { Message } from '../types';

container.registerSingleton(storageToken, Storage);
container.registerSingleton(databaseToken, Joplin);

const dataService = new DataService();

chrome.runtime.onMessage.addListener((message: Message) => {
  switch (message.event) {
    case CaptureEvents.Captured:
      return dataService.createQuote(message.payload);
    default:
      break;
  }
});
