import { validationResult } from "express-validator";

export function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.errors = result.array().map((item) => ({
    field: item.path,
    message: item.msg
  }));

  return next(error);
}
