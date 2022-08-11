import type { setBadgeText } from './badgeText';
import type { notify } from './notify';

export default interface ExtensionUI {
  setBadgeText: typeof setBadgeText;
  notify: typeof notify;
}
