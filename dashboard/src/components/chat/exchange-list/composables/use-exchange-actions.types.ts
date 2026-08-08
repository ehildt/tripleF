export interface ExchangeActions {
  retryExchange: (exchangeId: string) => void;
  deleteExchange: (exchangeId: string) => void;
  branchExchange: (exchangeId: string) => void;
}
