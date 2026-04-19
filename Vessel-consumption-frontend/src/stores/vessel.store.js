// src/stores/vessel.store.js
import { create } from "zustand";
import { vesselApi } from "../api/vessel.api";

export const useVesselStore = create((set, get) => ({
  vessels:  [],
  loading:  false,
  lastError: null,

  fetchVessels: async () => {
    set({ loading: true, lastError: null });
    try {
      const { data } = await vesselApi.list();
      set({ vessels: Array.isArray(data) ? data : [] });
    } catch (e) {
      set({ lastError: e });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  createVessel: async (body) => {
    const { data } = await vesselApi.create(body);
    await get().fetchVessels();
    return data;
  },

  updateVessel: async (id, body) => {
    const { data } = await vesselApi.update(id, body);
    await get().fetchVessels();
    return data;
  },

  removeVessel: async (id) => {
    await vesselApi.remove(id);
    await get().fetchVessels();
  },
}));