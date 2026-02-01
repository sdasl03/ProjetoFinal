import api from './index';

export const filesApi = {
  // Upload file
  uploadFile(formData) {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // List files for proposal
  getProposalFiles(proposalId) {
    return api.get(`/files/proposal/${proposalId}`);
  },

  // Download file
  downloadFile(fileId) {
    return api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
  },
};
