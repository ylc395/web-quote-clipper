import debounce from 'lodash.debounce';
import { createTooltip } from './capture';
import highlight from './highlight';

document.addEventListener('selectionchange', debounce(createTooltip, 500));
// window.addEventListener('load', highlight);
