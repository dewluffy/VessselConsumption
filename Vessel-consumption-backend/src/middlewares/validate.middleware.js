export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    req.validated = parsed;
    next();
  } catch (err) {
    console.error("Validation full error:", err); // ← ดู error ทั้งหมด
    console.error("Request body:", JSON.stringify(req.body, null, 2)); // ← ดูว่าส่งอะไรมา
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors ?? err.message ?? err,
    });
  }
};