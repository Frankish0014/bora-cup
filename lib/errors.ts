export class ConfigError extends Error {
  constructor(message = "The database is not configured yet.") {
    super(message);
    this.name = "ConfigError";
  }
}

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthError extends Error {
  constructor(message = "You need to sign in as an administrator.") {
    super(message);
    this.name = "AuthError";
  }
}

export function friendlyError(error: unknown, fallback: string) {
  if (error instanceof AppError || error instanceof ConfigError) return error.message;
  console.error(error);
  return fallback;
}

export function throwIfError(error: { message: string } | null, fallback: string) {
  if (!error) return;
  console.error(error.message);
  throw new AppError(fallback);
}
