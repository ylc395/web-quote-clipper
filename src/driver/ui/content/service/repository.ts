import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type Background from 'driver/background/api';

const endPoint = browser.runtime;
const repository = wrap<Background>({ endPoint });

export default repository;
