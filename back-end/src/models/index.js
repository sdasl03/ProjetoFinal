// models/index.js
export { default as User } from './User.js';
export { default as Proposal } from './Proposal.js';
export { default as ProposalCoadvisor } from './ProposalCoadvisor.js';
export { default as ProposalStudent } from './ProposalStudent.js';
export { default as RefreshToken } from './RefreshToken.js';
export { default as LoginAttempt } from './LoginAttempt.js';
export { default as PasswordReset } from './PasswordReset.js';
export { default as AccessLog } from './AccessLog.js';
export { default as FileAttachment } from './FileAttachment.js';

// Exportar tudo como um objeto também
const models = {
  User,
  Proposal,
  ProposalCoadvisor,
  ProposalStudent,
  RefreshToken,
  LoginAttempt,
  PasswordReset,
  AccessLog,
  FileAttachment,
};

export default models;