import * as fuelConsumptionService from "../services/fuel-consumption.service.js";

export const getByVoyage = async (req, res, next) => {
  try {
    const voyageId = Number(req.params.voyageId);
    const data = await fuelConsumptionService.getFuelConsumption(voyageId, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateRob = async (req, res, next) => {
  try {
    const voyageId = Number(req.params.voyageId);
    const rob = await fuelConsumptionService.upsertFuelRob(voyageId, req.user, req.body);
    res.json({ message: "ROB updated", rob });
  } catch (err) {
    next(err);
  }
};

export const createBunker = async (req, res, next) => {
  try {
    const voyageId = Number(req.params.voyageId);
    const bunker = await fuelConsumptionService.createFuelBunker(voyageId, req.user, req.body);
    res.status(201).json({ message: "Bunker created", bunker });
  } catch (err) {
    next(err);
  }
};

export const updateBunker = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const bunker = await fuelConsumptionService.updateFuelBunker(id, req.user, req.body);
    res.json({ message: "Bunker updated", bunker });
  } catch (err) {
    next(err);
  }
};

export const deleteBunker = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await fuelConsumptionService.deleteFuelBunker(id, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
