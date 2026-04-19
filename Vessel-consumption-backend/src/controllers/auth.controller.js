import * as authService from "../services/auth.service.js";
import createError from "../utils/create-error.util.js";
import { signToken } from "../utils/jwt.js";

export const login = async (req, res, next) => {
  try {
    const user = await authService.login(
      req.body.email,
      req.body.password
    );

    const token = signToken({
      id: user.id,
      role: user.role,
    });

    res.json

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(createError(401, err.message));
  }
};

export const getMe = async (req, res, next) => {
  try {
    const me = await authService.getMe(req.user.id);
    res.json(me);
  } catch (err) {
    next(err);
  }
};