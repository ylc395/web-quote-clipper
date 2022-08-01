export interface SetBadgeTextMessage {
  event: 'setBadgeText';
  payload: {
    total: number;
    active: number;
  };
}
