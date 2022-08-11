import browser from 'webextension-polyfill';
import { wrap } from 'lib/rpc';
import type ExtensionUI from 'driver/ui/extension/api';
import type MainUI from 'driver/ui/main/api';

const endPoint = browser.runtime;
const extension = wrap<ExtensionUI & MainUI>({ endPoint });

export default extension;
