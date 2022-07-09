import debounce from 'lodash.debounce';
import { createTooltip } from './capture';
import highlight from './highlight';

document.addEventListener('selectionchange', debounce(createTooltip, 1000));

const timer = setTimeout(() => {
  window.removeEventListener('load', highlight);
  highlight();
}, 3000);

window.addEventListener('load', highlight);
window.addEventListener('load', () => {
  clearTimeout(timer);
});
