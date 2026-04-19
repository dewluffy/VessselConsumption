import * as vesselService from "../services/vessel.service.js";

export const getAll = async (req, res, next) => {
  try {
    const vessels = await vesselService.getAll(req.user);
    res.json(vessels);
  } catch (err) {
    next(err);
  }
};


export const getById = async (req, res, next) => {
  try {
    const vessel = await vesselService.getById(+req.params.id, req.user);
    res.json(vessel);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const vessel = await vesselService.create(req.body);
    res.status(201).json(vessel);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const vessel = await vesselService.update(+req.params.id, req.body);
    res.json(vessel);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await vesselService.remove(+req.params.id);
    res.json({ message: "Vessel deleted" });
  } catch (err) {
    next(err);
  }
};

export const assignUser = async (req, res, next) => {
  try {
    const vesselId = Number(req.params.id);
    const { userId } = req.body;

    const result = await vesselService.assignUser(vesselId, userId);

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const unassignUser = async (req, res, next) => {
  try {
    const vesselId = Number(req.params.vesselId);
    const userId = Number(req.params.userId);

    const result = await vesselService.unassignUser(vesselId, userId);

    res.json(result);
  } catch (err) {
    next(err);
  }
};