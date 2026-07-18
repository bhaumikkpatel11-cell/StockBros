export class AngelOneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AngelOneError';
  }
}

export class AngelOneAuthError extends AngelOneError {
  constructor(message: string) {
    super(message);
    this.name = 'AngelOneAuthError';
  }
}

export class AngelOneRateLimitError extends AngelOneError {
  constructor(message: string) {
    super(message);
    this.name = 'AngelOneRateLimitError';
  }
}

export class AngelOneDataError extends AngelOneError {
  constructor(message: string) {
    super(message);
    this.name = 'AngelOneDataError';
  }
}
