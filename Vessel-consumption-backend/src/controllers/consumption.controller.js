import * as consumptionService from "../services/consumption.service.js";

export const listByActivity = async (req, res, next) => {
  try {
    const activityId = Number(req.params.activityId);
    const items = await consumptionService.listByActivity(activityId, req.user);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const activityId = Number(req.params.activityId);
    const item = await consumptionService.create(activityId, req.body, req.user);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await consumptionService.update(id, req.body, req.user);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await consumptionService.remove(id, req.user);
    res.json({ message: "Consumption removed" });
  } catch (err) {
    next(err);
  }
};
