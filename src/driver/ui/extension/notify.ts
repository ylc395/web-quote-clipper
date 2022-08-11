import browser from 'webextension-polyfill';

export function notify(payload: { title: string; content: string }) {
  browser.notifications.create({
    ...{ silent: true },
    title: payload.title,
    type: 'basic',
    iconUrl:
      ' data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw== ',
    message: payload.content,
  });
}
