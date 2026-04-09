// Merkezi hata sinifları — tum servisler ve route'lar kullanir

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, "NOT_FOUND", `${resource} bulunamadi${id ? `: ${id}` : ""}`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bu islemi yapma yetkiniz yok") {
    super(403, "FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Kimlik dogrulama gerekli") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}
