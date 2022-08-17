import { DatabaseConnectionError } from 'model/error';

export interface Request {
  path: string;
  args: any[];
}

export interface Response {
  errorType: number;
  payload?: any;
}

export function isResponse(v: any): v is Response {
  return 'errorType' in Object(v); // do not check 'payload' since message channel will remove undefined value
}

export function isRequest(v: any): v is Request {
  return 'path' in Object(v) && 'args' in Object(v);
}

export function getErrorType(e: any): number {
  if (e instanceof DatabaseConnectionError) {
    return 2;
  }

  return 1;
}

export function getErrorByType(res: Response) {
  if (res.errorType === 2) {
    return new DatabaseConnectionError(res.payload);
  }
}
