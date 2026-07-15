import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, Users, Upload, Database, Disc, Key, DollarSign, HardDrive, 
  Settings, LogOut, CheckCircle, Trash2, Plus, Play, Pause, RefreshCw, 
  ChevronRight, UserPlus, Shield, Lock, X, MapPin, Compass, Briefcase, 
  Calendar, Clock, Clipboard, FileText, Phone, Send, MessageSquare, Cloud, 
  Menu, Search, Bell, ChevronDown, ChevronLeft, HelpCircle, Sun, CalendarDays,
  Filter, ArrowUpDown, Tag, Info, AlertCircle, Sparkles, Check, ArrowRight,
  User, MoreHorizontal, Eye, PlusCircle, AlertTriangle, Star, MessageCircle,
  FileSpreadsheet, Download, Layers, Split, HelpCircle as HelpIcon,
  BookOpen, Compass as GeoIcon, CheckSquare, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Lead, CallLog } from '../types';

interface LeadManagementAndPipelineProps {
  leads: Lead[];
  onLeadsUpdated: () => void;
  telecallers: any[];
  setActiveCustomer360Lead: (lead: Lead | null) => void;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
}

// Kanban Stage constants
const KANBAN_STAGES = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Follow-up',
  'Won',
  'Lost'
];

// Bidirectional mapping helper
export function getKanbanStageOfLead(lead: Lead): string {
  const status = lead.status as string;
  if (KANBAN_STAGES.includes(status)) return status;
  
  switch (status) {
    case 'New': return 'New Lead';
    case 'Contacted':
    case 'Spoke': return 'Contacted';
    case 'Interested': return 'Qualified';
    case 'Nurturing': return 'Follow-up';
    case 'Closed Won': return 'Won';
    case 'Closed Lost': return 'Lost';
    case 'Not Interested': return 'Lost';
    default: return 'New Lead';
  }
}

export function mapStageToStatus(stage: string): 'New' | 'Interested' | 'Spoke' | 'Not Interested' | 'Contacted' | 'Nurturing' | 'Closed Won' | 'Closed Lost' {
  switch (stage) {
    case 'New Lead': return 'New';
    case 'Contacted': return 'Contacted';
    case 'Qualified': return 'Interested';
    case 'Proposal Sent': return 'Interested'; // Map appropriately to fit base DB status constraints
    case 'Negotiation': return 'Interested';
    case 'Follow-up': return 'Nurturing';
    case 'Won': return 'Closed Won';
    case 'Lost': return 'Closed Lost';
    default: return 'New';
  }
}

// Color coding for tags
const TAG_COLORS: { [key: string]: { bg: string, text: string, border: string } } = {
  'VIP': { bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', border: 'border-red-200' },
  'Hot Lead': { bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700', border: 'border-orange-200' },
  'Cold Lead': { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', border: 'border-blue-200' },
  'High Value': { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', border: 'border-purple-200' },
  'Returning': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Distributor': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Dealer': { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-700', border: 'border-teal-200' },
  'Corporate': { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Government': { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', border: 'border-amber-200' },
  'Startup': { bg: 'bg-pink-50 text-pink-700 border-pink-200', text: 'text-pink-700', border: 'border-pink-200' },
  'Custom': { bg: 'bg-slate-50 text-slate-700 border-slate-200', text: 'text-slate-700', border: 'border-slate-200' }
};

export default function LeadManagementAndPipeline({ 
  leads, 
  onLeadsUpdated, 
  telecallers, 
  setActiveCustomer360Lead,
  currentUser 
}: LeadManagementAndPipelineProps) {

  // Primary Workspace Views: 'pipeline' (Kanban) or 'grid' (Table) or 'analytics' (Deeper Insights)
  const [viewMode, setViewMode] = useState<'pipeline' | 'grid' | 'analytics'>('pipeline');

  // Search & Basic Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  
  // Advanced Filter Statuses
  const [showFilters, setShowFilters] = useState(false);
  const [filterFollowupToday, setFilterFollowupToday] = useState(false);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterMinValue, setFilterMinValue] = useState<number | ''>('');
  const [filterMaxValue, setFilterMaxValue] = useState<number | ''>('');
  
  // Sorting for Grid View
  const [sortField, setSortField] = useState<keyof Lead | 'stage'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Multi-Selection State for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkActionTarget, setBulkActionTarget] = useState<'assign' | 'status' | 'tag' | 'delete' | 'archive' | null>(null);
  const [bulkActionValue, setBulkActionValue] = useState('');

  // Duplicate Detection States
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<{ field: string, value: string, items: Lead[] }[]>([]);
  const [mergeTargetLead, setMergeTargetLead] = useState<Lead | null>(null);
  const [mergeSourceLead, setMergeSourceLead] = useState<Lead | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  // CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedImportLeads, setParsedImportLeads] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState({ total: 0, duplicates: 0, valid: 0 });
  const [isImporting, setIsImporting] = useState(false);

  // Customer Quick Preview Drawer State
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [previewDrawerTab, setPreviewDrawerTab] = useState<'summary' | 'timeline' | 'meetings' | 'notes' | 'calls' | 'invoices'>('summary');
  const [newNoteText, setNewNoteText] = useState('');
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingLocation, setNewMeetingLocation] = useState('Google Meet');

  // Drag and drop local state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Pre-load filter choices from existing leads dataset
  const filterOptions = useMemo(() => {
    const owners = new Set<string>();
    const sources = new Set<string>();
    const industries = new Set<string>();
    const cities = new Set<string>();
    const tagsSet = new Set<string>();

    leads.forEach(l => {
      if (l.assignedName) owners.add(l.assignedName);
      if (l.source) sources.add(l.source);
      if (l.industry) industries.add(l.industry);
      if (l.city) cities.add(l.city);
      if (l.tags) l.tags.forEach(t => tagsSet.add(t));
    });

    return {
      owners: Array.from(owners),
      sources: Array.from(sources),
      industries: Array.from(industries),
      cities: Array.from(cities),
      tags: Array.from(tagsSet)
    };
  }, [leads]);

  // Apply Smart Filters + Search Query to leads array
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery = 
          lead.name.toLowerCase().includes(q) ||
          (lead.companySize && lead.companySize.toLowerCase().includes(q)) ||
          (lead.phone && lead.phone.includes(q)) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          (lead.id && lead.id.toLowerCase().includes(q)) ||
          (lead.gst && lead.gst.toLowerCase().includes(q)) ||
          (lead.requirements && lead.requirements.toLowerCase().includes(q)) ||
          (lead.tags && lead.tags.some(t => t.toLowerCase().includes(q)));
        
        if (!matchesQuery) return false;
      }

      // 2. Owner
      if (selectedOwner !== 'All') {
        if (selectedOwner === 'Unassigned') {
          if (lead.assignedTo) return false;
        } else {
          if (lead.assignedName !== selectedOwner) return false;
        }
      }

      // 3. Priority
      if (selectedPriority !== 'All' && lead.priority !== selectedPriority) return false;

      // 4. Source
      if (selectedSource !== 'All' && lead.source !== selectedSource) return false;

      // 5. Industry
      if (selectedIndustry !== 'All' && lead.industry !== selectedIndustry) return false;

      // 6. City
      if (selectedCity !== 'All' && lead.city !== selectedCity) return false;

      // 7. Tag
      if (selectedTag !== 'All' && (!lead.tags || !lead.tags.includes(selectedTag))) return false;

      // 8. Lead Value range
      if (filterMinValue !== '') {
        if (!lead.dealValue || lead.dealValue < Number(filterMinValue)) return false;
      }
      if (filterMaxValue !== '') {
        if (!lead.dealValue || lead.dealValue > Number(filterMaxValue)) return false;
      }

      // 9. Followup Today
      if (filterFollowupToday) {
        const todayStr = new Date().toISOString().split('T')[0];
        const hasTodayFollowup = lead.followUps?.some(f => f.dateTime.startsWith(todayStr) && !f.completed);
        if (!hasTodayFollowup) return false;
      }

      // 10. Overdue Followup
      if (filterOverdue) {
        const now = new Date();
        const hasOverdue = lead.followUps?.some(f => {
          const fDate = new Date(f.dateTime);
          return fDate < now && !f.completed;
        });
        if (!hasOverdue) return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedOwner, selectedPriority, selectedSource, selectedIndustry, selectedCity, selectedTag, filterMinValue, filterMaxValue, filterFollowupToday, filterOverdue]);

  // Sort Grid View Leads
  const sortedLeads = useMemo(() => {
    if (viewMode !== 'grid') return filteredLeads;
    
    const sorted = [...filteredLeads];
    sorted.sort((a, b) => {
      let valA: any = sortField === 'stage' ? getKanbanStageOfLead(a) : a[sortField as keyof Lead];
      let valB: any = sortField === 'stage' ? getKanbanStageOfLead(b) : b[sortField as keyof Lead];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? (valA > valB ? 1 : -1) 
          : (valA < valB ? 1 : -1);
      }
    });
    return sorted;
  }, [filteredLeads, sortField, sortDirection, viewMode]);

  // Calculate Pipeline Analytics Metrics
  const pipelineMetrics = useMemo(() => {
    const totalLeadsCount = filteredLeads.length;
    let totalValue = 0;
    let wonCount = 0;
    let lostCount = 0;
    let contactedCount = 0;

    filteredLeads.forEach(l => {
      totalValue += l.dealValue || 0;
      const stage = getKanbanStageOfLead(l);
      if (stage === 'Won') wonCount++;
      if (stage === 'Lost') lostCount++;
      if (stage === 'Contacted') contactedCount++;
    });

    const winPercentage = totalLeadsCount > 0 ? Math.round((wonCount / totalLeadsCount) * 100) : 0;
    const lostPercentage = totalLeadsCount > 0 ? Math.round((lostCount / totalLeadsCount) * 100) : 0;

    // Source Breakdown
    const sourcesMap: { [key: string]: number } = {};
    filteredLeads.forEach(l => {
      const src = l.source || 'Unknown';
      sourcesMap[src] = (sourcesMap[src] || 0) + 1;
    });
    const sourceData = Object.keys(sourcesMap).map(name => ({ name, value: sourcesMap[name] }));

    // Lost Reasons Breakdown (simulated/extracted from notes or journey)
    const lostReasonsMap: { [key: string]: number } = {
      'High pricing': 0,
      'Competitor chosen': 0,
      'No requirements': 0,
      'Failed follow-up': 0,
      'Other': 0
    };
    filteredLeads.forEach(l => {
      if (getKanbanStageOfLead(l) === 'Lost') {
        const text = (l.requirements + ' ' + l.notes).toLowerCase();
        if (text.includes('expensive') || text.includes('price') || text.includes('budget')) {
          lostReasonsMap['High pricing']++;
        } else if (text.includes('competitor') || text.includes('other vendor') || text.includes('alternative')) {
          lostReasonsMap['Competitor chosen']++;
        } else if (text.includes('no requirement') || text.includes('not looking')) {
          lostReasonsMap['No requirements']++;
        } else if (text.includes('no answer') || text.includes('unreachable')) {
          lostReasonsMap['Failed follow-up']++;
        } else {
          lostReasonsMap['Other']++;
        }
      }
    });
    const lostReasonsData = Object.keys(lostReasonsMap).map(name => ({ name, value: lostReasonsMap[name] })).filter(d => d.value > 0);

    // Aging Distribution
    let ageFresh = 0; // <7 days
    let ageMid = 0;   // 7-30 days
    let ageOld = 0;   // 30+ days
    const now = new Date().getTime();
    filteredLeads.forEach(l => {
      const createdTime = new Date(l.createdAt).getTime();
      const diffDays = (now - createdTime) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) ageFresh++;
      else if (diffDays <= 30) ageMid++;
      else ageOld++;
    });

    const agingData = [
      { name: 'Fresh (<7 Days)', value: ageFresh },
      { name: 'Nurturing (7-30 Days)', value: ageMid },
      { name: 'Stagnant (>30 Days)', value: ageOld }
    ];

    // Executive performance (Won leads count)
    const execMap: { [key: string]: { won: number, total: number } } = {};
    filteredLeads.forEach(l => {
      const exec = l.assignedName || 'Unassigned';
      if (!execMap[exec]) execMap[exec] = { won: 0, total: 0 };
      execMap[exec].total++;
      if (getKanbanStageOfLead(l) === 'Won') execMap[exec].won++;
    });
    const topPerformers = Object.keys(execMap)
      .map(name => ({ name, won: execMap[name].won, total: execMap[name].total }))
      .sort((a, b) => b.won - a.won)
      .slice(0, 5);

    return {
      totalLeadsCount,
      totalValue,
      winPercentage,
      lostPercentage,
      contactedCount,
      sourceData,
      lostReasonsData,
      agingData,
      topPerformers
    };
  }, [filteredLeads]);

  // Scan DB for duplicates
  const runDuplicateScan = () => {
    const phones: { [key: string]: Lead[] } = {};
    const emails: { [key: string]: Lead[] } = {};
    const gsts: { [key: string]: Lead[] } = {};
    const companies: { [key: string]: Lead[] } = {};

    leads.forEach(l => {
      if (l.phone) {
        const cleaned = l.phone.replace(/[^0-9]/g, '');
        if (cleaned.length >= 10) {
          if (!phones[cleaned]) phones[cleaned] = [];
          phones[cleaned].push(l);
        }
      }
      if (l.email && l.email.includes('@')) {
        const cleaned = l.email.toLowerCase().trim();
        if (!emails[cleaned]) emails[cleaned] = [];
        emails[cleaned].push(l);
      }
      if (l.gst && l.gst.trim().length > 5) {
        const cleaned = l.gst.toUpperCase().trim();
        if (!gsts[cleaned]) gsts[cleaned] = [];
        gsts[cleaned].push(l);
      }
      if (l.requirements && l.requirements.toLowerCase().includes('company:')) {
        // Extract company if any, or just matches
      }
    });

    const groups: { field: string, value: string, items: Lead[] }[] = [];
    Object.keys(phones).forEach(p => {
      if (phones[p].length > 1) {
        groups.push({ field: 'Phone Number', value: p, items: phones[p] });
      }
    });
    Object.keys(emails).forEach(e => {
      if (emails[e].length > 1) {
        groups.push({ field: 'Email Address', value: e, items: emails[e] });
      }
    });
    Object.keys(gsts).forEach(g => {
      if (gsts[g].length > 1) {
        groups.push({ field: 'GST Identification', value: g, items: gsts[g] });
      }
    });

    setDuplicateGroups(groups);
    setShowDuplicateModal(true);
  };

  // Execute Merge Operation
  const handleMergeLeads = async () => {
    if (!mergeTargetLead || !mergeSourceLead) return;
    setIsMerging(true);

    try {
      // Create merged parameters
      const mergedTags = Array.from(new Set([...(mergeTargetLead.tags || []), ...(mergeSourceLead.tags || [])]));
      const mergedNotes = [
        ...(mergeTargetLead.notesList || []),
        ...(mergeSourceLead.notesList || []).map(n => ({
          ...n,
          text: `[Merged from Duplicate Lead]: ${n.text}`
        })),
        {
          id: 'note-' + Date.now(),
          text: `Profile merged with duplicate lead "${mergeSourceLead.name}" (ID: ${mergeSourceLead.id}) on ${new Date().toLocaleDateString()}`,
          author: currentUser.name,
          timestamp: new Date().toISOString()
        }
      ];

      const mergedTasks = [...(mergeTargetLead.tasks || []), ...(mergeSourceLead.tasks || [])];
      const mergedFollowups = [...(mergeTargetLead.followUps || []), ...(mergeSourceLead.followUps || [])];
      const mergedMeetings = [...(mergeTargetLead.meetings || []), ...(mergeSourceLead.meetings || [])];

      // Step 1: Update Target Lead with combined resources
      const targetRes = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          leadId: mergeTargetLead.id,
          tags: mergedTags,
          notesList: mergedNotes,
          tasks: mergedTasks,
          followUps: mergedFollowups,
          meetings: mergedMeetings,
          dealValue: (mergeTargetLead.dealValue || 0) + (mergeSourceLead.dealValue || 0),
          requirements: `${mergeTargetLead.requirements}\n[Merged source requirements]: ${mergeSourceLead.requirements}`
        })
      });

      if (targetRes.ok) {
        // Step 2: Delete duplicate source lead
        await fetch('/api/leads/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUser.role,
            'x-user-id': currentUser.id
          },
          body: JSON.stringify({ leadId: mergeSourceLead.id })
        });

        onLeadsUpdated();
        setMergeTargetLead(null);
        setMergeSourceLead(null);
        // Rescan duplicate list
        runDuplicateScan();
      }
    } catch (err) {
      console.error('Merge operation failed', err);
    } finally {
      setIsMerging(false);
    }
  };

  // CSV Import Parser
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvRawText(text);

      const lines = text.split('\n');
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsed: any[] = [];
      let duplicateFlags = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const leadObj: any = {};
        
        headers.forEach((h, idx) => {
          const colVal = cols[idx] || '';
          if (h.toLowerCase().includes('name')) leadObj.name = colVal;
          else if (h.toLowerCase().includes('phone')) leadObj.phone = colVal;
          else if (h.toLowerCase().includes('email')) leadObj.email = colVal;
          else if (h.toLowerCase().includes('whatsapp')) leadObj.whatsapp = colVal;
          else if (h.toLowerCase().includes('requirements') || h.toLowerCase().includes('note')) leadObj.requirements = colVal;
          else if (h.toLowerCase().includes('value') || h.toLowerCase().includes('deal')) leadObj.dealValue = Number(colVal) || 0;
          else if (h.toLowerCase().includes('priority')) leadObj.priority = colVal;
          else if (h.toLowerCase().includes('source')) leadObj.source = colVal;
          else if (h.toLowerCase().includes('industry')) leadObj.industry = colVal;
          else if (h.toLowerCase().includes('city')) leadObj.city = colVal;
        });

        if (leadObj.name && leadObj.phone) {
          // Check for existing duplicates
          const isDuplicate = leads.some(l => l.phone.replace(/[^0-9]/g, '') === leadObj.phone.replace(/[^0-9]/g, ''));
          leadObj.isDuplicate = isDuplicate;
          if (isDuplicate) duplicateFlags++;
          parsed.push(leadObj);
        }
      }

      setParsedImportLeads(parsed);
      setImportSummary({
        total: parsed.length,
        duplicates: duplicateFlags,
        valid: parsed.length - duplicateFlags
      });
    };
    reader.readAsText(file);
  };

  // Trigger Bulk Save for CSV Import
  const executeCSVImport = async () => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ leads: parsedImportLeads })
      });

      if (res.ok) {
        onLeadsUpdated();
        setShowImportModal(false);
        setParsedImportLeads([]);
        setCsvRawText('');
      }
    } catch (err) {
      console.error('Import failed', err);
    } finally {
      setIsImporting(false);
    }
  };

  // Drag-and-Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!id) return;

    const leadObj = leads.find(l => l.id === id);
    if (!leadObj) return;

    const currentStage = getKanbanStageOfLead(leadObj);
    if (currentStage === targetStage) return;

    // Execute state update
    const targetStatus = mapStageToStatus(targetStage);
    try {
      const res = await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          leadId: id,
          status: targetStatus,
          notes: `Moved from ${currentStage} to ${targetStage} via Kanban interface`,
          dealValue: leadObj.dealValue || 0,
          updatedBy: currentUser.name
        })
      });

      if (res.ok) {
        onLeadsUpdated();
      }
    } catch (err) {
      console.error('Failed to change lead status', err);
    }
  };

  // Bulk Operations Handlers
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const handleExecuteBulkAction = async () => {
    if (selectedLeadIds.length === 0 || !bulkActionTarget) return;

    try {
      if (bulkActionTarget === 'assign') {
        const res = await fetch('/api/leads/bulk-assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUser.role,
            'x-user-id': currentUser.id
          },
          body: JSON.stringify({
            leadIds: selectedLeadIds,
            userId: bulkActionValue === 'unassign' ? 'unassign' : bulkActionValue,
            adminId: currentUser.id,
            adminName: currentUser.name
          })
        });

        if (res.ok) {
          onLeadsUpdated();
          setSelectedLeadIds([]);
          setBulkActionTarget(null);
          setBulkActionValue('');
        }
      } else if (bulkActionTarget === 'status') {
        // Change Statuses sequentially (safely updates history)
        await Promise.all(selectedLeadIds.map(id => {
          const lObj = leads.find(x => x.id === id);
          return fetch('/api/leads/update-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': currentUser.role,
              'x-user-id': currentUser.id
            },
            body: JSON.stringify({
              leadId: id,
              status: bulkActionValue,
              notes: `Bulk status update to ${bulkActionValue}`,
              dealValue: lObj?.dealValue || 0,
              updatedBy: currentUser.name
            })
          });
        }));

        onLeadsUpdated();
        setSelectedLeadIds([]);
        setBulkActionTarget(null);
        setBulkActionValue('');
      } else if (bulkActionTarget === 'tag') {
        // Apply Tags
        await Promise.all(selectedLeadIds.map(id => {
          const leadObj = leads.find(l => l.id === id);
          const currentTags = leadObj?.tags || [];
          const newTags = Array.from(new Set([...currentTags, bulkActionValue]));
          return fetch('/api/leads/update-360', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': currentUser.role,
              'x-user-id': currentUser.id
            },
            body: JSON.stringify({
              leadId: id,
              tags: newTags
            })
          });
        }));

        onLeadsUpdated();
        setSelectedLeadIds([]);
        setBulkActionTarget(null);
        setBulkActionValue('');
      } else if (bulkActionTarget === 'delete') {
        if (confirm(`Are you absolutely sure you want to delete ${selectedLeadIds.length} selected leads?`)) {
          await Promise.all(selectedLeadIds.map(id => 
            fetch('/api/leads/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-role': currentUser.role,
                'x-user-id': currentUser.id
              },
              body: JSON.stringify({ leadId: id })
            })
          ));

          onLeadsUpdated();
          setSelectedLeadIds([]);
          setBulkActionTarget(null);
        }
      }
    } catch (err) {
      console.error('Bulk action failed', err);
    }
  };

  // Export Filtered Leads to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    
    const headers = ['Lead ID', 'Name', 'Phone', 'WhatsApp', 'Email', 'Source', 'Industry', 'Stage', 'Deal Value', 'Priority', 'Owner', 'City', 'State', 'Country', 'Created Date'];
    const csvRows = [headers.join(',')];

    filteredLeads.forEach(l => {
      const row = [
        `"${l.id}"`,
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.phone}"`,
        `"${l.whatsapp || ''}"`,
        `"${l.email || ''}"`,
        `"${l.source || ''}"`,
        `"${l.industry || ''}"`,
        `"${getKanbanStageOfLead(l)}"`,
        `"${l.dealValue || 0}"`,
        `"${l.priority || 'Medium'}"`,
        `"${l.assignedName || 'Unassigned'}"`,
        `"${l.city || ''}"`,
        `"${l.state || ''}"`,
        `"${l.country || ''}"`,
        `"${new Date(l.createdAt).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `HubSphere_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  // Add Notes inside Quick Preview Drawer
  const handleAddPreviewNote = async () => {
    if (!previewLead || !newNoteText.trim()) return;

    const updatedNotes = [
      ...(previewLead.notesList || []),
      {
        id: 'note-' + Date.now(),
        text: newNoteText,
        author: currentUser.name,
        timestamp: new Date().toISOString()
      }
    ];

    try {
      const res = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          leadId: previewLead.id,
          notesList: updatedNotes
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setPreviewLead(updated.lead);
        onLeadsUpdated();
        setNewNoteText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Meeting inside Quick Preview Drawer
  const handleAddPreviewMeeting = async () => {
    if (!previewLead || !newMeetingTitle.trim() || !newMeetingDate) return;

    const updatedMeetings = [
      ...(previewLead.meetings || []),
      {
        id: 'meet-' + Date.now(),
        title: newMeetingTitle,
        dateTime: newMeetingDate,
        location: newMeetingLocation,
        status: 'Scheduled' as const,
        createdBy: currentUser.name
      }
    ];

    try {
      const res = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          leadId: previewLead.id,
          meetings: updatedMeetings
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setPreviewLead(updated.lead);
        onLeadsUpdated();
        setNewMeetingTitle('');
        setNewMeetingDate('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group filtered leads by stage for Kanban layout
  const columnsData = useMemo(() => {
    const columns: { [key: string]: Lead[] } = {};
    KANBAN_STAGES.forEach(stage => {
      columns[stage] = [];
    });

    filteredLeads.forEach(lead => {
      const stage = getKanbanStageOfLead(lead);
      if (columns[stage]) {
        columns[stage].push(lead);
      } else {
        // Fallback to New Lead
        columns['New Lead'].push(lead);
      }
    });

    return columns;
  }, [filteredLeads]);

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* 1. TOP PIPELINE STATISTICS BAR (Salesforce/Zoho Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pipeline Value</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{pipelineMetrics.totalValue.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-400 mt-1">Sum of active deal values</p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{pipelineMetrics.winPercentage}%</h3>
            <p className="text-xs text-slate-400 mt-1">Percent of won leads</p>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${pipelineMetrics.winPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lost Rate</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{pipelineMetrics.lostPercentage}%</h3>
            <p className="text-xs text-slate-400 mt-1">Percent of lost leads</p>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-red-400 h-full" style={{ width: `${pipelineMetrics.lostPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads Scope</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{pipelineMetrics.totalLeadsCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Filtered leads scope</p>
          </div>
        </div>

        {/* AI Ready Quick Insight Block */}
        <div className="bg-gradient-to-tr from-violet-50 to-blue-50 border border-violet-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(124,58,237,0.05)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-violet-600 text-white rounded text-[8px] font-bold tracking-widest uppercase">Coming in V4</div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Pipeline Health
            </span>
          </div>
          <div className="mt-2 text-left">
            <div className="text-[11px] font-medium text-violet-900 leading-snug">
              "Pipeline value up 14% this month. Negotation cycle exhibits 82% conversion probability with standard pricing model."
            </div>
          </div>
        </div>

      </div>

      {/* 2. ACTIONS AND CONTROLS ROW */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Left Block: View Selector & Basic Stats */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('pipeline')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${viewMode === 'pipeline' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Kanban Pipeline
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Interactive Table
            </button>
            <button 
              onClick={() => setViewMode('analytics')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${viewMode === 'analytics' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> CRM Analytics
            </button>
          </div>

          {/* Right Block: Global Search, Quick Tools */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Search phone, name, email, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 cursor-pointer text-xs font-bold ${showFilters ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              title="Toggle Advanced Filters"
            >
              <Filter className="w-4 h-4" /> 
              <span>Filters</span>
              {(selectedOwner !== 'All' || selectedPriority !== 'All' || selectedSource !== 'All' || selectedIndustry !== 'All' || selectedCity !== 'All' || selectedTag !== 'All' || filterMinValue !== '' || filterMaxValue !== '' || filterFollowupToday || filterOverdue) && (
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>

            <button 
              onClick={runDuplicateScan}
              className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
              title="Scan Duplicate Leads"
            >
              <Split className="w-4 h-4 text-slate-500" />
              <span>Deduplicate</span>
            </button>

            <button 
              onClick={() => setShowImportModal(true)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
              title="Import leads from CSV file"
            >
              <Upload className="w-4 h-4 text-blue-500" />
              <span>Import</span>
            </button>

            <button 
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
              title="Export leads to CSV"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Export</span>
            </button>

          </div>

        </div>

        {/* 3. EXPANDABLE ADVANCED FILTERS BOARD */}
        {showFilters && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left animate-fade-in">
            
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Assigned Owner</label>
              <select 
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none mt-1"
              >
                <option value="All">All Owners</option>
                <option value="Unassigned">-- Unassigned --</option>
                {filterOptions.owners.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Priority Stage</label>
              <select 
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none mt-1"
              >
                <option value="All">All Priorities</option>
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lead Source</label>
              <select 
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none mt-1"
              >
                <option value="All">All Sources</option>
                {filterOptions.sources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Vertical / Industry</label>
              <select 
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none mt-1"
              >
                <option value="All">All Industries</option>
                {filterOptions.industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Geography / City</label>
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none mt-1"
              >
                <option value="All">All Cities</option>
                {filterOptions.cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Color Tags</label>
              <select 
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none mt-1"
              >
                <option value="All">All Tags</option>
                {filterOptions.tags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Expected Deal Value Range</label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="number" 
                  placeholder="Min Value"
                  value={filterMinValue}
                  onChange={(e) => setFilterMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-1/2 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Max Value"
                  value={filterMaxValue}
                  onChange={(e) => setFilterMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-1/2 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={filterFollowupToday} 
                  onChange={(e) => setFilterFollowupToday(e.target.checked)}
                  className="rounded text-blue-600 accent-blue-600"
                />
                <span>Follow-up Scheduled Today</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input 
                  type="checkbox" 
                  checked={filterOverdue} 
                  onChange={(e) => setFilterOverdue(e.target.checked)}
                  className="rounded text-red-600 accent-red-600"
                />
                <span>Overdue Followups</span>
              </label>
            </div>

            <div className="col-span-2 flex justify-end items-end">
              <button 
                onClick={() => {
                  setSelectedOwner('All');
                  setSelectedPriority('All');
                  setSelectedSource('All');
                  setSelectedIndustry('All');
                  setSelectedCity('All');
                  setSelectedTag('All');
                  setFilterMinValue('');
                  setFilterMaxValue('');
                  setFilterFollowupToday(false);
                  setFilterOverdue(false);
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>

          </div>
        )}

      </div>

      {/* 4. MAIN WORKSPACE VIEW ROUTER */}
      <div className="relative">
        
        {/* KANBAN BOARD VIEW */}
        {viewMode === 'pipeline' && (
          <div className="flex gap-4 overflow-x-auto pb-6 select-none scrollbar-thin scrollbar-thumb-slate-200">
            {KANBAN_STAGES.map(stage => {
              const stageLeads = columnsData[stage] || [];
              const stageValue = stageLeads.reduce((acc, current) => acc + (current.dealValue || 0), 0);
              const isActiveDragColumn = dragOverColumn === stage;

              return (
                <div 
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`flex-shrink-0 w-80 rounded-2xl p-3 text-left transition-all duration-200 ${isActiveDragColumn ? 'bg-blue-50/50 border-2 border-dashed border-blue-400' : 'bg-slate-100/50 border border-slate-200/50'}`}
                >
                  
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-3 px-1">
                    <div>
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          stage === 'New Lead' ? 'bg-blue-500' :
                          stage === 'Contacted' ? 'bg-sky-400' :
                          stage === 'Qualified' ? 'bg-teal-400' :
                          stage === 'Proposal Sent' ? 'bg-indigo-400' :
                          stage === 'Negotiation' ? 'bg-amber-400' :
                          stage === 'Follow-up' ? 'bg-purple-400' :
                          stage === 'Won' ? 'bg-emerald-500' : 'bg-rose-400'
                        }`}></span>
                        {stage}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">₹{stageValue.toLocaleString('en-IN')}</p>
                    </div>
                    <span className="bg-white px-2 py-0.5 border border-slate-200/50 rounded-full text-[10px] font-black text-slate-500 shadow-sm">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards stack */}
                  <div className="space-y-2 max-h-[64vh] overflow-y-auto pr-1">
                    {stageLeads.map(lead => {
                      return (
                        <div 
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`bg-white border border-slate-100 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing text-left relative ${draggedLeadId === lead.id ? 'opacity-40 border-dashed border-slate-300' : ''}`}
                        >
                          {/* Priority Indicator */}
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              lead.priority === 'High' ? 'bg-red-50 text-red-600' :
                              lead.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {lead.priority || 'Medium'}
                            </span>
                            
                            <span className="text-[10px] font-bold text-slate-700">
                              ₹{(lead.dealValue || 0).toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Customer Name */}
                          <h5 
                            onClick={() => setPreviewLead(lead)}
                            className="text-xs font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition line-clamp-1"
                          >
                            {lead.name}
                          </h5>

                          {/* Company / Industry info */}
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Briefcase className="w-2.5 h-2.5" />
                            <span className="truncate">{lead.requirements || 'Requirements not specified'}</span>
                          </div>

                          {/* Assigned Agent */}
                          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[120px]">{lead.assignedName || 'Unassigned'}</span>
                            </div>

                            {/* Icons shortcuts */}
                            <div className="flex gap-1.5">
                              {lead.tags && lead.tags.slice(0, 2).map(tag => (
                                <span 
                                  key={tag} 
                                  className={`text-[8px] font-black px-1.5 py-0.5 rounded ${TAG_COLORS[tag]?.bg || 'bg-slate-50 text-slate-600'}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* AI Conversion Prob Pill */}
                          {lead.aiCopilotAnalysis && (
                            <div className="mt-2 py-0.5 px-1.5 bg-violet-50 text-violet-700 text-[8px] font-black rounded flex items-center justify-between">
                              <span className="flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5 text-violet-500" /> AI Score</span>
                              <span>{lead.aiCopilotAnalysis.leadScore}%</span>
                            </div>
                          )}

                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-[10px] font-medium">
                        Drag leads here
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* INTERACTIVE TABLE GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm animate-fade-in text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 cursor-pointer" onClick={() => { setSortField('name'); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      <div className="flex items-center gap-1">
                        <span>Lead Customer</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400">Contact Channels</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400">Context Specs</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 cursor-pointer" onClick={() => { setSortField('priority'); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      <div className="flex items-center gap-1">
                        <span>Priority</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 cursor-pointer" onClick={() => { setSortField('stage'); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      <div className="flex items-center gap-1">
                        <span>Kanban Stage</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 cursor-pointer" onClick={() => { setSortField('dealValue'); setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      <div className="flex items-center gap-1">
                        <span>Value</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400">Owner</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {sortedLeads.map(lead => {
                    const kStage = getKanbanStageOfLead(lead);
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={() => toggleSelectLead(lead.id)}
                            className="rounded accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer" onClick={() => setPreviewLead(lead)}>
                            {lead.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{lead.id}</div>
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {lead.tags.map(t => (
                                <span key={t} className={`text-[8px] font-black px-1.5 py-0.5 rounded ${TAG_COLORS[t]?.bg || 'bg-slate-50 text-slate-600'}`}>{t}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="font-medium flex items-center gap-1 text-slate-700">
                            <span>📞</span> <span>{lead.phone}</span>
                          </div>
                          {lead.whatsapp && (
                            <div className="text-emerald-600 font-bold flex items-center gap-1">
                              <span>💬</span> <span>{lead.whatsapp}</span>
                            </div>
                          )}
                          {lead.email && <div className="text-slate-400 text-[10px]">{lead.email}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700 line-clamp-1">{lead.requirements || 'No specifics'}</div>
                          <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                            {lead.source && <span>Src: {lead.source}</span>}
                            {lead.industry && <span>Ind: {lead.industry}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            lead.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                            lead.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {lead.priority || 'Medium'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            kStage === 'Won' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            kStage === 'Lost' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {kStage}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          ₹{(lead.dealValue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{lead.assignedName || 'Unassigned'}</div>
                          {lead.assignedAt && (
                            <div className="text-[9px] text-slate-400 mt-0.5">Assigned {new Date(lead.assignedAt).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <button 
                              onClick={() => setPreviewLead(lead)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer"
                              title="Quick Customer Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setActiveCustomer360Lead(lead)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-600 hover:text-blue-900 transition cursor-pointer"
                              title="Full Customer 360 Workspace"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this lead?')) {
                                  const res = await fetch('/api/leads/delete', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-user-role': currentUser.role,
                                      'x-user-id': currentUser.id
                                    },
                                    body: JSON.stringify({ leadId: lead.id })
                                  });
                                  if (res.ok) onLeadsUpdated();
                                }
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 hover:text-red-900 transition cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {sortedLeads.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs">
                        No customer leads found matching your active filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEEPER ANALYTICS WORKSPACE VIEW */}
        {viewMode === 'analytics' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Chart 1: Source Distribution */}
            <div className="border border-slate-50 p-4 rounded-xl bg-slate-50/20">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-slate-400" /> Lead Acquisition Source Distribution
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineMetrics.sourceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} />
                    <YAxis fontSize={10} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Lead Aging Distribution */}
            <div className="border border-slate-50 p-4 rounded-xl bg-slate-50/20">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Lead Aging & Velocity Status
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineMetrics.agingData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} />
                    <YAxis fontSize={10} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Lost Reasons analysis */}
            <div className="border border-slate-50 p-4 rounded-xl bg-slate-50/20">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-slate-400" /> Major Pipeline Leak & Dropoff Factors
              </h4>
              {pipelineMetrics.lostReasonsData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineMetrics.lostReasonsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} width={100} />
                      <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                      <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  Zero lost leads flagged. Excellent conversion rate!
                </div>
              )}
            </div>

            {/* List: Top Performing Executives */}
            <div className="border border-slate-50 p-4 rounded-xl bg-slate-50/20">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500" /> Leading Sales Executives Leaders Board
              </h4>
              <div className="space-y-3">
                {pipelineMetrics.topPerformers.map((exec, idx) => (
                  <div key={exec.name} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{exec.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{exec.total} Managed Leads</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-600">{exec.won} Won</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Success Rate: {exec.total > 0 ? Math.round((exec.won / exec.total) * 100) : 0}%</div>
                    </div>
                  </div>
                ))}
                {pipelineMetrics.topPerformers.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No conversion analytics logged yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 5. FLOATING GLASS BULK OPERATIONS BAR */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl z-50 animate-slide-up">
          <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-wider">
            <CheckSquare className="w-4 h-4" />
            <span>{selectedLeadIds.length} Selected Leads</span>
          </div>
          
          <div className="h-5 w-[1px] bg-slate-800"></div>

          <div className="flex items-center gap-3">
            <select 
              value={bulkActionTarget || ''}
              onChange={(e) => {
                setBulkActionTarget(e.target.value as any);
                setBulkActionValue('');
              }}
              className="bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none"
            >
              <option value="">Bulk Operation Action...</option>
              <option value="assign">Assign Owner</option>
              <option value="status">Change Lead Status</option>
              <option value="tag">Add Tag Badge</option>
              <option value="delete">Bulk Delete Records</option>
            </select>

            {bulkActionTarget === 'assign' && (
              <select 
                value={bulkActionValue}
                onChange={(e) => setBulkActionValue(e.target.value)}
                className="bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none animate-fade-in"
              >
                <option value="">Select Telecaller...</option>
                <option value="unassign">Unassign</option>
                {telecallers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}

            {bulkActionTarget === 'status' && (
              <select 
                value={bulkActionValue}
                onChange={(e) => setBulkActionValue(e.target.value)}
                className="bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none animate-fade-in"
              >
                <option value="">Select Status...</option>
                <option value="New">New</option>
                <option value="Spoke">Contacted</option>
                <option value="Interested">Qualified</option>
                <option value="Nurturing">Nurturing</option>
                <option value="Closed Won">Closed Won (Won)</option>
                <option value="Closed Lost">Closed Lost (Lost)</option>
              </select>
            )}

            {bulkActionTarget === 'tag' && (
              <select 
                value={bulkActionValue}
                onChange={(e) => setBulkActionValue(e.target.value)}
                className="bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none animate-fade-in"
              >
                <option value="">Select Tag...</option>
                {Object.keys(TAG_COLORS).map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}

            <button 
              onClick={handleExecuteBulkAction}
              disabled={bulkActionTarget && !bulkActionValue && bulkActionTarget !== 'delete'}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Apply Updates
            </button>
          </div>

          <button 
            onClick={() => setSelectedLeadIds([])} 
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. DEDUPLICATE MODAL POPUP */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Split className="w-5 h-5 text-indigo-500" /> Smart CRM Duplicate Verification Panel
                </h3>
                <p className="text-xs text-slate-400 mt-1">Found potential identical leads based on phone numbers, email, or GST inputs.</p>
              </div>
              <button onClick={() => setShowDuplicateModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
              {duplicateGroups.map((group, gIdx) => {
                return (
                  <div key={gIdx} className="border border-slate-200/65 rounded-2xl p-4 bg-slate-50/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider">{group.field}</span>
                      <span className="text-xs font-mono font-bold text-slate-600">{group.value}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.items.map(item => {
                        const isSelectedTarget = mergeTargetLead?.id === item.id;
                        const isSelectedSource = mergeSourceLead?.id === item.id;

                        return (
                          <div 
                            key={item.id}
                            className={`p-3 border rounded-xl flex justify-between items-start transition ${
                              isSelectedTarget ? 'bg-blue-50/50 border-blue-400 shadow-sm' :
                              isSelectedSource ? 'bg-orange-50/50 border-orange-400 shadow-sm' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-800">{item.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">ID: {item.id}</div>
                              <div className="text-[10px] text-slate-500 mt-1">📞 {item.phone}</div>
                              {item.email && <div className="text-[10px] text-slate-400">{item.email}</div>}
                              <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">"{item.requirements}"</div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <button 
                                onClick={() => {
                                  setMergeTargetLead(item);
                                  if (mergeSourceLead?.id === item.id) setMergeSourceLead(null);
                                }}
                                className={`text-[10px] font-black px-2 py-1 rounded transition ${isSelectedTarget ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                              >
                                Keep Principal
                              </button>
                              <button 
                                onClick={() => {
                                  setMergeSourceLead(item);
                                  if (mergeTargetLead?.id === item.id) setMergeTargetLead(null);
                                }}
                                className={`text-[10px] font-black px-2 py-1 rounded transition ${isSelectedSource ? 'bg-orange-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                              >
                                Merge Duplicate
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}

              {duplicateGroups.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  🎉 Absolute clean health! Found zero duplicate leads.
                </div>
              )}
            </div>

            {mergeTargetLead && mergeSourceLead && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800">
                    Ready to merge: <span className="text-orange-600 font-black">"{mergeSourceLead.name}"</span> into <span className="text-blue-600 font-black">"{mergeTargetLead.name}"</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">This will consolidate all timeline history, tags, notes, tasks, meetings, and sum deal value. Duplicate lead will be archived/removed.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setMergeTargetLead(null); setMergeSourceLead(null); }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-700 cursor-pointer"
                  >
                    Cancel Selection
                  </button>
                  <button 
                    onClick={handleMergeLeads}
                    disabled={isMerging}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black text-white flex items-center gap-1 cursor-pointer"
                  >
                    {isMerging ? 'Merging...' : 'Execute Consolidation'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 7. IMPORT LEAD MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-5xl w-full p-6 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
            
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" /> Enterprise Leads Upload Center
                </h3>
                <p className="text-xs text-slate-400 mt-1">Upload a CSV file containing client data with columns: Name, Phone, Email, WhatsApp, Requirements.</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setParsedImportLeads([]); }} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
              
              {!parsedImportLeads.length ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-slate-50/30">
                  <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-4" />
                  <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-blue-600/10 mb-2">
                    Browse CSV File
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden" 
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">Supported format headers: Name, Phone, Email, Requirements, WhatsApp, Deal Value, Source</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Import Analytics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="text-[10px] font-black uppercase text-slate-400">Total Parse Rows</div>
                      <div className="text-lg font-black text-slate-800 mt-1">{importSummary.total}</div>
                    </div>
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
                      <div className="text-[10px] font-black uppercase text-red-500">Duplicate Phone Flags</div>
                      <div className="text-lg font-black text-red-600 mt-1">{importSummary.duplicates}</div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                      <div className="text-[10px] font-black uppercase text-emerald-500">Ready for Ingest</div>
                      <div className="text-lg font-black text-emerald-600 mt-1">{importSummary.valid}</div>
                    </div>
                  </div>

                  {/* Datagrid Preview */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/60 border-b border-slate-100 font-bold text-slate-500">
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Phone</th>
                          <th className="px-4 py-2.5">Email</th>
                          <th className="px-4 py-2.5">WhatsApp</th>
                          <th className="px-4 py-2.5">Source</th>
                          <th className="px-4 py-2.5">Validation Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {parsedImportLeads.map((item, idx) => (
                          <tr key={idx} className={item.isDuplicate ? 'bg-red-50/20' : ''}>
                            <td className="px-4 py-2 font-bold text-slate-700">{item.name}</td>
                            <td className="px-4 py-2">{item.phone}</td>
                            <td className="px-4 py-2 text-slate-400">{item.email || '-'}</td>
                            <td className="px-4 py-2">{item.whatsapp || '-'}</td>
                            <td className="px-4 py-2 text-slate-400">{item.source || '-'}</td>
                            <td className="px-4 py-2">
                              {item.isDuplicate ? (
                                <span className="text-[10px] font-black text-red-500 flex items-center gap-0.5">⚠️ Phone Duplicate</span>
                              ) : (
                                <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5">✔ Approved</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>

            {parsedImportLeads.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  onClick={() => { setParsedImportLeads([]); setCsvRawText(''); }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-700 cursor-pointer"
                >
                  Reset File
                </button>
                <button 
                  onClick={executeCSVImport}
                  disabled={isImporting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-black text-white flex items-center gap-1 cursor-pointer"
                >
                  {isImporting ? 'Ingesting...' : 'Execute Batch Upload'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 8. QUICK CUSTOMER PREVIEW SLIDER DRAWER */}
      {previewLead && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            onClick={() => setPreviewLead(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
          />
          
          <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-white border-l border-slate-100 shadow-2xl flex flex-col h-full animate-slide-left">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="text-left">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-wider">Quick Review</span>
                <h3 className="text-base font-black text-slate-800 mt-1">{previewLead.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Assigned to: <span className="font-bold text-slate-600">{previewLead.assignedName || 'Unassigned'}</span></p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setActiveCustomer360Lead(previewLead); setPreviewLead(null); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" /> Full 360 Workspace
                </button>
                <button 
                  onClick={() => setPreviewLead(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick action badges & score strip */}
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/10 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  previewLead.priority === 'High' ? 'bg-red-50 text-red-600' :
                  previewLead.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {previewLead.priority || 'Medium'}
                </span>
                
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-wider">
                  {getKanbanStageOfLead(previewLead)}
                </span>
              </div>

              {/* AI Ready widgets */}
              {previewLead.aiCopilotAnalysis ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">AI Conversion Prob</div>
                    <div className="text-xs font-black text-violet-700">{previewLead.aiCopilotAnalysis.leadScore}%</div>
                  </div>
                </div>
              ) : (
                <div className="text-[9px] font-bold text-violet-600 bg-violet-50/50 px-2 py-1 rounded flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-violet-500" /> AI Conversion Ready
                </div>
              )}
            </div>

            {/* Tab navigation within quick preview */}
            <div className="border-b border-slate-100 flex">
              {(['summary', 'timeline', 'notes', 'meetings', 'calls'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPreviewDrawerTab(tab)}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
                    previewDrawerTab === tab 
                      ? 'border-blue-600 text-blue-600 bg-blue-50/10' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/30'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 text-left">
              
              {/* SUMMARY TAB */}
              {previewDrawerTab === 'summary' && (
                <div className="space-y-5">
                  
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Customer Core Information</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-slate-400 font-medium">Customer Name</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.name}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Expected Value</div>
                        <div className="font-bold text-slate-700 mt-0.5">₹{(previewLead.dealValue || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Phone</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.phone}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">WhatsApp</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.whatsapp || '-'}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-slate-400 font-medium">Email Address</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.email || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Enterprise Alignment Context</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-slate-400 font-medium">Lead Acquisition Source</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.source || 'Organic Search'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Industry Vertical</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.industry || 'Manufacturing'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">City Location</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.city || 'Bangalore'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-medium">Country / Region</div>
                        <div className="font-bold text-slate-700 mt-0.5">{previewLead.country || 'India'}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-slate-400 font-medium">Specific Client Requirements</div>
                        <div className="font-bold text-slate-700 mt-0.5 whitespace-pre-line">{previewLead.requirements}</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Prediction Placeholder Card */}
                  <div className="bg-gradient-to-tr from-violet-500/5 to-indigo-500/5 border border-violet-500/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-violet-600 text-white rounded text-[8px] font-bold tracking-widest uppercase">Coming in V4</div>
                    <h4 className="text-xs font-black text-violet-700 flex items-center gap-1 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-600" /> AI Sales Assist Recommendations
                    </h4>
                    
                    <div className="space-y-3 text-xs mt-3">
                      <div>
                        <div className="text-slate-400 font-bold">AI Recommended Next Best Action</div>
                        <div className="font-medium text-slate-700 mt-0.5">Send pricing proposal with a 5% distributor rebate by Friday afternoon.</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-bold">AI Executive Summary</div>
                        <div className="font-medium text-slate-700 mt-0.5">High intent buyer reviewing distributor options. Email connection established, telephone spoke successful. Risk level Low.</div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TIMELINE TAB */}
              {previewDrawerTab === 'timeline' && (
                <div className="relative pl-6 border-l border-slate-100 space-y-6">
                  {previewLead.journey && previewLead.journey.length > 0 ? (
                    previewLead.journey.map((event, idx) => (
                      <div key={idx} className="relative">
                        {/* Bullet point icon */}
                        <span className="absolute -left-9 top-0.5 bg-white border border-blue-500/40 p-1 rounded-full text-blue-500 shadow-sm">
                          <Activity className="w-3 h-3" />
                        </span>
                        
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-700">{event.status} Stage Event</span>
                            <span className="text-[10px] text-slate-400">{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{event.notes}</p>
                          <div className="text-[10px] text-blue-500 font-bold mt-1">Logged by: {event.updatedBy}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No chronological activity events logged yet.
                    </div>
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {previewDrawerTab === 'notes' && (
                <div className="space-y-4">
                  
                  {/* Create Note */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type quick internal note..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                    />
                    <button 
                      onClick={handleAddPreviewNote}
                      disabled={!newNoteText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>

                  {/* Notes Feed */}
                  <div className="space-y-2">
                    {previewLead.notesList && previewLead.notesList.length > 0 ? (
                      previewLead.notesList.map((note) => (
                        <div key={note.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <p className="text-xs text-slate-600">{note.text}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2">
                            <span>By: {note.author}</span>
                            <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No team notes logged on this client.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* MEETINGS TAB */}
              {previewDrawerTab === 'meetings' && (
                <div className="space-y-4">
                  
                  {/* Create Meeting Form */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Schedule New Meeting</h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Meeting Subject / Goal"
                        value={newMeetingTitle}
                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                        className="col-span-2 bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      />
                      <input 
                        type="datetime-local" 
                        value={newMeetingDate}
                        onChange={(e) => setNewMeetingDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      />
                      <select 
                        value={newMeetingLocation}
                        onChange={(e) => setNewMeetingLocation(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      >
                        <option value="Google Meet">🎥 Google Meet</option>
                        <option value="In Person Office">🏢 In Person Office</option>
                        <option value="Telephone Call">📞 Telephone Call</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleAddPreviewMeeting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl cursor-pointer transition"
                    >
                      Schedule Calendar Invites
                    </button>
                  </div>

                  {/* Meetings List */}
                  <div className="space-y-2">
                    {previewLead.meetings && previewLead.meetings.length > 0 ? (
                      previewLead.meetings.map((meet) => (
                        <div key={meet.id} className="bg-white border border-slate-200/60 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <div className="text-xs font-bold text-slate-800">{meet.title}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(meet.dateTime).toLocaleString()}</div>
                            <div className="text-[10px] text-blue-500 mt-0.5 font-semibold">{meet.location}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-wider">
                            {meet.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No upcoming meetings scheduled.
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* CALLS TAB */}
              {previewDrawerTab === 'calls' && (
                <div className="space-y-2">
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Integrate dialer to start outbound voices call logs.
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
