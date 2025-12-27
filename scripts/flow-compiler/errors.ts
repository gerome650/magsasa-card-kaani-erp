export class FlowCompilerError extends Error {
  constructor(
    message: string,
    public file?: string,
    public line?: number,
    public column?: number
  ) {
    super(message);
    this.name = 'FlowCompilerError';
  }

  toString(): string {
    let msg = this.message;
    if (this.file) {
      msg = `${this.file}`;
      if (this.line !== undefined) {
        msg += `:${this.line}`;
        if (this.column !== undefined) {
          msg += `:${this.column}`;
        }
      }
      msg += ` - ${this.message}`;
    }
    return msg;
  }
}

export function errorAt(message: string, file?: string, line?: number, column?: number): never {
  throw new FlowCompilerError(message, file, line, column);
}

