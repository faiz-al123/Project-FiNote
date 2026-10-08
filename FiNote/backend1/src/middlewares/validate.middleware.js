// Satu middleware validasi yang dapat dipakai ulang oleh semua endpoint.

function validate(validatorFn) {
  return (req, res, next) => {
    const errorMessage = validatorFn(req.body || {});

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
        data: null,
      });
    }

    next();
  };
}

module.exports = validate;
