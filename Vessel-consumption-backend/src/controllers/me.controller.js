import * as meService from "../services/me.service.js";

export const getMyVessels = async (req, res, next) => {
  try {
    const vessels = await meService.getMyVessels(req.user.id);
    res.json(vessels);
  } catch (err) {
    next(err);
  }
};
