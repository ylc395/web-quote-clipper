import type QuoteService from './service/QuoteService';

type MainUI = Pick<QuoteService, 'updateMatched'> & {
  refresh: QuoteService['init'];
};

export default MainUI;
