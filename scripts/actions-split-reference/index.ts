/**
 * BARREL RE-EXPORT — backward compatibility layer.
 * 
 * All functions have been split into domain-specific modules under ./actions/
 * This file re-exports everything so existing `import { ... } from '@/app/actions'`
 * statements continue to work without modification.
 * 
 * For new code, prefer importing from the specific module directly:
 *   import { getClients } from '@/app/actions/clients'
 *   import { getDashboardStats } from '@/app/actions/finance'
 */

// Shared utilities
export { logActivity, getActivities } from './actions/utils';

// Clients
export { getClients, createClient, getClient, deleteClient, openClientFolder, updateClient, updateClientValue, updateClientAvatar, getClientPortalData, getClientPortalProject, addVideoCommentPortal } from './actions/clients';

// Shoots
export { getAllShoots, addShoot, updateShoot, deleteShoot, getShootAssignments, getAllShootAssignments, assignMemberToShoot, removeMemberFromShoot, updateShootVideoTitle, updateShootCreative, finishShoot, revertShoot, updateShootClient, approveShoot, denyShoot, toggleShootBlocking, updateShootTime } from './actions/shoots';

// Projects
export { getProjects, createProject, getProjectById, getProjectShoots, updateProjectStatus, updateProjectTitle, updateProjectDetails, getProjectCosts, addProjectCost, updateProjectCost, deleteProjectCost, getProjectPostProdWorkflows } from './actions/projects';

// Tasks
export { getTasks, addTask, toggleTask, deleteTask, getAllDashboardTasks, getProjectTasks, getTaskStages, addProjectTask, toggleProjectTask, updateTaskStage, updateTaskAssignee, deleteProjectTask, addTaskStage, deleteTaskStage, updateProjectTask } from './actions/tasks';

// Finance
export { getDashboardStats, getFinanceData, addPayment, getPayments, updatePaymentStatus, deletePayment, getCommissions, getCommissionsByProject, addCommission, deleteCommission, addExpense, deleteExpense, getExpenses, syncProjectToExpenses, getProjectServices, addProjectService, deleteProjectService, updateProjectService, getPipelineStages, addPipelineStage, deletePipelineStage, updateClientPipelineStage, addBetaFeedback, getBetaFeedback, resolveBetaFeedback, deleteBetaFeedback, getSettings, updateSettings } from './actions/finance';

// Team
export { getTeamMembers, addTeamMember, updateTeamMember, getTeamMember, getMemberAvailability, setMemberAvailability, getMemberFinancials, getTeamSchedule } from './actions/team';

// Agencies
export { getAgencies, createAgency, deleteAgency, getAgencyStats, getAgencyById, getAgencyClients } from './actions/agencies';

// Availability & Auth
export { getAvailabilitySlots, createAvailabilitySlot, updateAvailabilitySlot, deleteAvailabilitySlot, requestAvailabilitySlot, getClientsForBooking, requestShoot, getAvailabilityRequests, updateAvailabilityRequest, signInAction, clientLogout } from './actions/availability';

// Analytics, PostProd, Misc
export { getShootVolumeData, getProjectOriginData, getProjectCompletionData, getMonthlyRevenueData, getTopClientsData, getTeamUtilizationData, getPostProdItems, updatePostProdStatus, getAuditLogs, submitPublicBooking, getUnreadNotifications, markNotificationAsRead, getSocialLinks, addSocialLink, deleteSocialLink, getContentIdeas, addContentIdea, deleteContentIdea, getCredentials, addCredential, deleteCredential, getShootVideos, addShootVideo, deleteShootVideo, getVideoNotes, addVideoNote, deleteVideoNote } from './actions/misc';

// Types re-exported
export type { SearchResult } from './actions/misc';
export type { DashboardTask } from './actions/tasks';
