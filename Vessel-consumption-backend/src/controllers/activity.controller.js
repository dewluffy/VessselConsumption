import * as activityService from "../services/activity.service.js";

export const listByVoyage = async (req, res, next) => {
  try {
    const voyageId = Number(req.params.voyageId);
    const activities = await activityService.listByVoyage(voyageId, req.user);
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const voyageId = Number(req.params.voyageId);
    const activity = await activityService.createActivity(voyageId, req.body, req.user);
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const activity = await activityService.getById(id, req.user);
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const activity = await activityService.updateActivity(id, req.body, req.user);
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await activityService.removeActivity(id, req.user);
    res.json({ message: "Activity removed" });
  } catch (err) {
    next(err);
  }
};
