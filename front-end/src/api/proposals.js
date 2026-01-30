// src/api/proposals.js
import api from './index';

export const proposalsApi = {
  // List proposals with filters
  getProposals(params) {
    return api.get('/proposals', { params });
  },

  // Create proposal
  createProposal(data) {
    return api.post('/proposals', data);
  },

  // Get proposal by ID
  getProposalById(id) {
    return api.get(`/proposals/${id}`);
  },

  // Update proposal
  updateProposal(id, data) {
    return api.put(`/proposals/${id}`, data);
  },

  // Submit proposal for review
  submitProposal(id) {
    return api.post(`/proposals/${id}/submit`);
  },

  // Get coadvisors for proposal
  getProposalCoadvisors(id) {
    return api.get(`/proposals/${id}/coadvisors`);
  },

  // Get students for proposal
  getProposalStudents(id) {
    return api.get(`/proposals/${id}/students`);
  },
};
