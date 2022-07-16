export interface SetBadgeTextMessage {
  event: 'setBadgeText';
  payload: {
    total: number;
    active: number;
  };
}

export const setBadgeText = (payload: SetBadgeTextMessage['payload']) => {
  return chrome.runtime.sendMessage({ event: 'setBadgeText', payload });
};
