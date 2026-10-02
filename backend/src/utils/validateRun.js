/** Very small local implementation of async express-validator handlers. */
export function validationRun(validations) {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        return res.status(422).json({
          success: false,
          error: result.array()[0].msg,
          details: result.array().map((e) => ({ field: e.path, message: e.msg })),
        });
      }
    }
    return next();
  };
}

export function validationChain(validations) {
  return (req, res, next) => {
    validationRun(validations)(req, res, next);
  };
}
