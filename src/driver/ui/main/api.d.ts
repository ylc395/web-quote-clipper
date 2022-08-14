import type QuoteService from './service/QuoteService';

type MainUI = Pick<QuoteService, 'updateMatched'> & {
  refresh: () => Promise<void>;
};

export default MainUI;
