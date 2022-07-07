import debounce from 'lodash.debounce';
import { createTooltip } from './capture';
import highlight from './highlight';

document.addEventListener('selectionchange', debounce(createTooltip, 1000));
window.addEventListener('load', highlight);
