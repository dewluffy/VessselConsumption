import * as voyageService from "../services/voyage.service.js";

export const listByVessel = async (req, res, next) => {
  try {
    const vesselId = Number(req.params.vesselId);
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;

    const voyages = await voyageService.listByVessel(
      vesselId,
      req.user,
      { year, month }
    );

    res.json(voyages);
  } catch (err) {
    next(err);
  }
};

export const createVoyage = async (req, res, next) => {
  try {
    const vesselId = Number(req.params.vesselId);
    const voyage = await voyageService.createVoyage(vesselId, req.body, req.user);
    res.status(201).json(voyage);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const voyage = await voyageService.getById(id, req.user);
    res.json(voyage);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const voyage = await voyageService.updateVoyage(id, req.body, req.user);
    res.json(voyage);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const voyage = await voyageService.updateStatus(id, status, req.user);
    res.json(voyage);
  } catch (err) {
    next(err);
  }
};

export const updatePosting = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { postingYear, postingMonth } = req.body;

    const voyage = await voyageService.updatePosting(id, { postingYear, postingMonth });
    res.json(voyage);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await voyageService.remove(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};