import debounce from 'lodash.debounce';
import { createTooltip } from './capture';

document.addEventListener('selectionchange', debounce(createTooltip, 500));
