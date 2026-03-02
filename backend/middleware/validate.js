/**
 * Generic request body validator middleware.
 * @param {string[]} requiredFields - List of required field names.
 */
function validateBody(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter((f) => {
      const value = req.body[f];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        fields: missing,
      });
    }
    next();
  };
}

/**
 * Validate UUID format.
 */
function validateUUID(paramName = "id") {
  return (req, res, next) => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }
    next();
  };
}

/**
 * Validate pagination query params.
 */
function validatePagination(req, _res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  req.pagination = { page, limit, offset };
  next();
}

module.exports = { validateBody, validateUUID, validatePagination };
