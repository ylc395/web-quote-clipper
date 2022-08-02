export interface SetBadgeTextMessage {
  event: 'setBadgeText';
  payload: {
    total: number;
    active: number;
  };
}

export interface NotifyMessage {
  event: 'notify';
  payload: {
    title: string;
    content: string;
  };
}

export type Message = NotifyMessage | SetBadgeTextMessage;
