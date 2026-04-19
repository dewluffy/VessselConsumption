import createError from "../utils/create-error.util.js";

export default (req, res, next) => {
  next(createError(404, `Route ${req.method} ${req.originalUrl} not found`));
};
