export class DhanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DhanError';
  }
}

export class DhanAuthError extends DhanError {
  constructor(message: string = 'Authentication failed with Dhan HQ API') {
    super(message);
    this.name = 'DhanAuthError';
  }
}

export class DhanRateLimitError extends DhanError {
  constructor(message: string = 'Dhan HQ API rate limit exceeded') {
    super(message);
    this.name = 'DhanRateLimitError';
  }
}

export class DhanValidationError extends DhanError {
  constructor(message: string) {
    super(message);
    this.name = 'DhanValidationError';
  }
}
