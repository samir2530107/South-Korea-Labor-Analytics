// Small helpers shared by all routes.

// Turns "2024" into 2024. Anything invalid becomes null.
function toInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

// Turns DB values (number / string / null) into a number or null.
function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Wraps an async route so any error becomes a clean JSON response.
function route(name, handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(`${name} error:`, error.message);
      res.status(500).json({
        success: false,
        message: `Unable to retrieve ${name} data. Check that MySQL is running and the database is imported.`
      });
    }
  };
}

module.exports = { toInt, num, route };
