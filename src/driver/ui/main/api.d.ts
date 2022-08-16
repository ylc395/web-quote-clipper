import type QuoteService from './service/QuoteService';

type MainUI = Pick<QuoteService, 'updateMatched'>;
export default MainUI;
