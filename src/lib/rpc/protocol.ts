export interface Request {
  path: string;
  args: any[];
}

export interface Response {
  isError: boolean;
  payload?: any;
}

export function isResponse(v: any): v is Response {
  return 'isError' in Object(v); // do not check 'payload' since message channel will remove undefined value
}

export function isRequest(v: any): v is Request {
  return 'path' in Object(v) && 'args' in Object(v);
}
