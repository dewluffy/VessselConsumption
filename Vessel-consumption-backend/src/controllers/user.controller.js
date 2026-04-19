import * as userService from "../services/user.service.js";
import createError from "../utils/create-error.util.js";

export const listUsers = async (req, res, next) => {
  try {
    // validated จะมี { query, params, body } ตาม schema ที่ผ่าน validate()
    const query = req.validated?.query ?? req.query;
    const users = await userService.listUsers(query);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const params = req.validated?.params ?? req.params;
    const user = await userService.getUserById(params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const body = req.validated?.body ?? req.body;
    const created = await userService.createUser(body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const params = req.validated?.params ?? req.params;
    const body = req.validated?.body ?? req.body;

    const updated = await userService.updateUser(params.id, body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const removeUser = async (req, res, next) => {
  try {
    const params = req.validated?.params ?? req.params;
    const id = Number(params.id);

    // กันลบตัวเอง
    if (req.user?.id === id) throw createError(400, "Cannot delete yourself");

    const result = await userService.removeUser(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
