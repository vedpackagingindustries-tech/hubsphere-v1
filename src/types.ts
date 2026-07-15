export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: 'admin' | 'sub-admin' | 'head' | 'staff' | 'telecaller';
  department?: 'Tech' | 'NonTech' | 'Sales';
  salaryBase: number;
  commissionRate: number; // commission per qualified lead or per task
  monthlyTarget?: number;
  status: 'active' | 'suspended';
  position?: string;
  tenantId?: string;
  companyId?: string;
}

export interface LeadJourneyEvent {
  status: string;
  notes?: string;
  updatedBy: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  requirements: string;
  status: 'New' | 'Interested' | 'Spoke' | 'Not Interested' | 'Contacted' | 'Nurturing' | 'Closed Won' | 'Closed Lost';
  assignedTo: string | null; // User ID
  assignedName: string | null; // User Name
  assignedByAdminId?: string | null;
  assignedByAdminName?: string | null;
  assignedAt?: string | null;
  notes: string;
  lastCalled?: string;
  createdAt: string;
  journey?: LeadJourneyEvent[];
  dealValue?: number;
  priority?: 'High' | 'Medium' | 'Low';
  tags?: string[];
  source?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  gst?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pin?: string;
  notesList?: { id: string; text: string; author: string; timestamp: string; pinned?: boolean; isInternal?: boolean }[];
  documents?: { id: string; name: string; size: string; uploadedAt: string; data?: string }[];
  tasks?: { id: string; title: string; dueDate: string; priority: 'High' | 'Medium' | 'Low'; completed: boolean; createdAt: string }[];
  followUps?: { id: string; title: string; dateTime: string; completed: boolean; outcome?: string; createdAt: string }[];
  meetings?: { id: string; title: string; dateTime: string; location: string; status: 'Scheduled' | 'Completed' | 'Cancelled'; outcome?: string; createdBy?: string }[];
  aiCopilotAnalysis?: {
    leadScore: number;
    scoreExplanation: string;
    suggestedNextAction: string;
    summary: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    riskExplanation: string;
    salesProbability: number;
    updatedAt: string;
  };
  tenantId?: string;
  companyId?: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  telecallerId: string;
  telecallerName: string;
  status: 'Interested' | 'Spoke' | 'Not Interested';
  duration: number; // in seconds
  timestamp: string;
  notes: string;
  hasRecording: boolean;
  recordingId?: string;
  adminFeedback?: string;
  tenantId?: string;
  companyId?: string;
}

export interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  reply?: string;
  timestamp: string;
  tenantId?: string;
  companyId?: string;
}

export interface AutoCallingConfig {
  delaySeconds: number;
  enabled: boolean;
}

export interface Tenant {
  tenantId: string;
  companyName: string;
  companyId: string;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}
