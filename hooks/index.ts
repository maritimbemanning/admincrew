// ═══════════════════════════════════════════════════════
// HOOK EXPORTS
// ═══════════════════════════════════════════════════════

// Candidates
export * from './use-candidates'
export * from './use-candidate'

// Documents
export * from './use-documents'

// Pools
export * from './use-pools'

// CRM
export * from './use-crm-contacts'
export * from './use-crm-contact'
export * from './use-crm-activities'
export * from './use-crm-tasks'
export * from './use-organizations'
export * from './use-contacts'
export * from './use-deals'

// Operations
export * from './use-requests'
export * from './use-request'
export * from './use-matching'
export * from './use-assignments'

// Contracts
export * from './use-contracts'

// Timesheets
export * from './use-timesheets'

// Portal Inbox (bluecrew.no data)
// NOTE: use-inbox.ts is the main inbox hook file used by app/(dashboard)/inbox/page.tsx
// The individual hooks below have duplicate function names - use with caution
export * from './use-inbox'
// These exports may conflict with use-inbox.ts exports:
// export * from './use-job-applications'  // Has duplicate useJobApplications
// export * from './use-interest-leads'    // Has duplicate useInterestLeads
// export * from './use-staffing-needs'    // Has duplicate useStaffingNeeds
export * from './use-portal-contacts'

// QMS
export * from './use-qms-documents'
export * from './use-qms-nc'
export * from './use-qms-risks'

// Dashboard
export * from './use-dashboard-stats'

// UI
export * from './use-mobile'
export * from './use-debounce'
export * from './use-keyboard-shortcut'
export * from './use-local-storage'

