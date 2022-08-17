export class DatabaseConnectionError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}
