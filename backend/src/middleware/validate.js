const { validationResult } = require('express-validator');

// Run after an array of express-validator checks. Collects all errors into
// one clean 400 response instead of letting bad input reach controllers.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;