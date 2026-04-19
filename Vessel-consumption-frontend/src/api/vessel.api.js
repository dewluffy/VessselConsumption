// src/api/vessel.api.js
import { api } from "../lib/api";

export const vesselApi = {
  list:           ()               => api.get("/api/vessels"),
  getById:        (id)             => api.get(`/api/vessels/${id}`),
  create:         (body)           => api.post("/api/vessels", body),
  update:         (id, body)       => api.patch(`/api/vessels/${id}`, body),
  remove:         (id)             => api.delete(`/api/vessels/${id}`),
  getAssignments: (id)             => api.get(`/api/vessels/${id}/assignments`),
  assignUser:     (id, body)       => api.post(`/api/vessels/${id}/assign`, body),
  unassignUser:   (vesselId, userId) => api.delete(`/api/vessels/${vesselId}/assignments/${userId}`),
};