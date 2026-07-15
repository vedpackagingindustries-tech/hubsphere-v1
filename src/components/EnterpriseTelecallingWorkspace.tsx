import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Play, Pause, Square, Activity, 
  Clock, User, Users, Check, CheckCircle, XCircle, Plus, Trash, Settings, 
  Search, Share2, Mail, MessageSquare, Calendar, Tag, AlertCircle, MapPin, 
  Building, Globe, FileText, Sparkles, Star, UserCheck, RefreshCw, ArrowRight, 
  ChevronRight, Info, AlertTriangle, Paperclip, ExternalLink, HelpCircle
} from 'lucide-react';
import { Lead, CallLog } from '../types';
import { Card, Button, Input, Badge } from './ui/ReusableComponents';

interface EnterpriseTelecallingWorkspaceProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  onClose?: () => void;
}

export default function EnterpriseTelecallingWorkspace({ user, onClose }: EnterpriseTelecallingWorkspaceProps) {
  // --- States ---
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Left Panel Tabs
  const [activeQueueTab, setActiveQueueTab] = useState<'queue' | 'today' | 'scheduled' | 'callback' | 'missed' | 'completed'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loader and Refresh States
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Calling & Dialpad states
  const [dialedNumber, setDialedNumber] = useState('');
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'on_hold' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');

  // Live Notes States
  const [liveNotes, setLiveNotes] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [showTeamMention, setShowTeamMention] = useState(false);

  // Call Disposition Modal State
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [dispositionOutcome, setDispositionOutcome] = useState<'Interested' | 'Follow-up' | 'Callback' | 'No Answer' | 'Busy' | 'Wrong Number' | 'Not Interested' | 'Converted' | 'Lost'>('Interested');
  const [dispositionRemarks, setDispositionRemarks] = useState('');
  const [dispositionDealValue, setDispositionDealValue] = useState<number>(0);
  const [savingDisposition, setSavingDisposition] = useState(false);

  // Follow-up Scheduler Card States
  const [followUpTitle, setFollowUpTitle] = useState('Product Demo & Quotation Review');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [followUpType, setFollowUpType] = useState<'call' | 'meeting' | 'task'>('call');
  const [followUpOwner, setFollowUpOwner] = useState(user.name);

  // Right Side Tabs
  const [activeRightTab, setActiveRightTab] = useState<'profile' | 'timeline' | 'ai_insights'>('profile');

  // Dynamic tags
  const [newTagText, setNewTagText] = useState('');

  // Audio Context Ref for DTMF Keypad Tones
  const audioCtxRef = useRef<AudioContext | null>(null);
  const callIntervalRef = useRef<any>(null);

  // --- Load Data ---
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setLoading(true);
        const headers = { 'x-user-role': user.role, 'x-user-id': user.id };
        const [leadsRes, callsRes] = await Promise.all([
          fetch('/api/leads', { headers }),
          fetch('/api/calls', { headers })
        ]);

        let loadedLeads: Lead[] = [];
        if (leadsRes.ok) {
          const lds = await leadsRes.json();
          loadedLeads = lds.filter((l: Lead) => l.assignedTo === user.id);
          setLeads(loadedLeads);
        }

        if (callsRes.ok) {
          const cls = await callsRes.json();
          setCallLogs(cls.filter((c: CallLog) => c.telecallerId === user.id));
        }

        // Auto select first lead if none selected
        if (loadedLeads.length > 0 && !selectedLead) {
          setSelectedLead(loadedLeads[0]);
        }
      } catch (err) {
        console.error('Error fetching enterprise telecalling workspace data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaceData();
  }, [refreshTrigger, user.id, user.role]);

  // Sync Timer for active call
  useEffect(() => {
    let interval: any;
    if (callState === 'connected' || callState === 'ringing') {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Simulate periodic Network Latency/Quality changes
  useEffect(() => {
    const interval = setInterval(() => {
      const qualities: ('excellent' | 'good' | 'poor')[] = ['excellent', 'good', 'poor'];
      const rand = Math.random();
      if (rand < 0.75) setNetworkQuality('excellent');
      else if (rand < 0.95) setNetworkQuality('good');
      else setNetworkQuality('poor');
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // --- Synthesize DTMF Dialpad Sounds ---
  const playDTMFTone = (digit: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const freqs: Record<string, [number, number]> = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
      };

      if (!freqs[digit]) return;

      const ctx = audioCtxRef.current || new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freqs[digit][0];
      osc2.frequency.value = freqs[digit][1];

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.15);
    } catch (err) {
      console.warn('Audio Context DTMF error:', err);
    }
  };

  // --- Handlers ---
  const handleKeypadPress = (digit: string) => {
    playDTMFTone(digit);
    setDialedNumber(prev => prev + digit);
  };

  const handleStartCall = () => {
    if (!selectedLead && !dialedNumber) return;
    
    // If dialing a custom number and it matches a lead, load that lead
    if (dialedNumber && (!selectedLead || selectedLead.phone !== dialedNumber)) {
      const matched = leads.find(l => l.phone.replace(/[^\d]/g, '').includes(dialedNumber.replace(/[^\d]/g, '')));
      if (matched) {
        setSelectedLead(matched);
      }
    }

    setCallState('ringing');
    setLiveNotes('');
    setIsStarred(false);

    // Simulate standard Indian Ringing Tone and then connect after 3 seconds
    setTimeout(() => {
      setCallState('connected');
    }, 2800);
  };

  const handleEndCall = () => {
    setCallState('ended');
    setShowDispositionModal(true);
  };

  const handleToggleHold = () => {
    setCallState(prev => prev === 'connected' ? 'on_hold' : prev === 'on_hold' ? 'connected' : prev);
  };

  const handleAppendTimestamp = () => {
    const now = new Date();
    const timeStr = `[${now.toLocaleTimeString()}] `;
    setLiveNotes(prev => prev + (prev ? '\n' : '') + timeStr);
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    try {
      const updatedNotesList = [
        ...(selectedLead.notesList || []),
        {
          id: 'note-' + Date.now(),
          text: liveNotes || 'Saved Call Scratchpad details.',
          author: user.name,
          timestamp: new Date().toISOString()
        }
      ];

      const response = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          notesList: updatedNotesList,
          notes: liveNotes || selectedLead.notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedLead(result.lead);
        setLeads(prev => prev.map(l => l.id === result.lead.id ? result.lead : l));
        setLiveNotes('');
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  // Save Disposition Outcome & Create/Link follow-ups
  const handleSubmitDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (!dispositionRemarks.trim()) return;

    setSavingDisposition(true);
    try {
      // 1. Save Call Log via Backend API
      const callLogPayload = {
        leadId: selectedLead.id,
        telecallerId: user.id,
        status: ['Interested', 'Spoke', 'Not Interested'].includes(dispositionOutcome) 
          ? dispositionOutcome 
          : 'Spoke', // fallback standard api outcomes
        duration: callTimer,
        notes: `Outcome: ${dispositionOutcome}. Remarks: ${dispositionRemarks}`,
        dealValue: dispositionDealValue || selectedLead.dealValue || 0,
      };

      const callResponse = await fetch('/api/calls/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify(callLogPayload)
      });

      // 2. Prepare followups, tasks, or meetings if scheduled
      let updatedFollowUps = [...(selectedLead.followUps || [])];
      let updatedMeetings = [...(selectedLead.meetings || [])];

      if (followUpDate && followUpTime) {
        const fullDateTime = `${followUpDate}T${followUpTime}`;
        if (followUpType === 'meeting') {
          updatedMeetings.push({
            id: 'meet-' + Date.now(),
            title: followUpTitle,
            dateTime: fullDateTime,
            location: 'Google Meet / Dialer Virtual',
            status: 'Scheduled',
            outcome: '',
            createdBy: user.name
          });
        } else {
          updatedFollowUps.push({
            id: 'follow-' + Date.now(),
            title: followUpTitle,
            dateTime: fullDateTime,
            completed: false,
            outcome: '',
            createdAt: new Date().toISOString()
          });
        }
      }

      // 3. Update lead fields and journey via update-360 API
      const updatedNotesList = [
        ...(selectedLead.notesList || []),
        {
          id: 'note-disp-' + Date.now(),
          text: `[Call Logged] Outbound conversation completed. Duration: ${callTimer}s. Outcome: ${dispositionOutcome}. Notes: ${dispositionRemarks}`,
          author: user.name,
          timestamp: new Date().toISOString()
        }
      ];

      const updatePayload: any = {
        leadId: selectedLead.id,
        notesList: updatedNotesList,
        dealValue: dispositionDealValue || selectedLead.dealValue || 0,
        followUps: updatedFollowUps,
        meetings: updatedMeetings
      };

      // Map disposition to lead status
      let mappedStatus: any = selectedLead.status;
      if (dispositionOutcome === 'Interested') mappedStatus = 'Interested';
      else if (dispositionOutcome === 'Converted') mappedStatus = 'Closed Won';
      else if (dispositionOutcome === 'Lost') mappedStatus = 'Closed Lost';
      else if (dispositionOutcome === 'Not Interested') mappedStatus = 'Not Interested';
      else if (['Follow-up', 'Callback'].includes(dispositionOutcome)) mappedStatus = 'Nurturing';
      else mappedStatus = 'Contacted';

      updatePayload.status = mappedStatus;

      const leadResponse = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify(updatePayload)
      });

      if (leadResponse.ok && callResponse.ok) {
        const leadResult = await leadResponse.json();
        setSelectedLead(leadResult.lead);
        setLeads(prev => prev.map(l => l.id === leadResult.lead.id ? leadResult.lead : l));
        
        // Reset states
        setCallState('idle');
        setDialedNumber('');
        setDispositionRemarks('');
        setFollowUpDate('');
        setFollowUpTime('');
        setShowDispositionModal(false);
        setRefreshTrigger(prev => prev + 1);

        // Load next lead in queue automatically! (Save & Next flow)
        handleLoadNextLead(leadResult.lead.id);
      }
    } catch (err) {
      console.error('Error saving call disposition outcome:', err);
    } finally {
      setSavingDisposition(false);
    }
  };

  const handleLoadNextLead = (currentLeadId: string) => {
    const currentIndex = filteredLeads.findIndex(l => l.id === currentLeadId);
    if (currentIndex !== -1 && currentIndex + 1 < filteredLeads.length) {
      setSelectedLead(filteredLeads[currentIndex + 1]);
    } else if (filteredLeads.length > 0) {
      // Loop back or select first
      setSelectedLead(filteredLeads[0]);
    }
  };

  const handleAddTag = async () => {
    if (!selectedLead || !newTagText.trim()) return;
    const cleanTag = newTagText.trim();
    if ((selectedLead.tags || []).includes(cleanTag)) return;

    try {
      const updatedTags = [...(selectedLead.tags || []), cleanTag];
      const response = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          tags: updatedTags
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedLead(result.lead);
        setLeads(prev => prev.map(l => l.id === result.lead.id ? result.lead : l));
        setNewTagText('');
      }
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedLead) return;
    try {
      const updatedTags = (selectedLead.tags || []).filter(t => t !== tagToRemove);
      const response = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          tags: updatedTags
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedLead(result.lead);
        setLeads(prev => prev.map(l => l.id === result.lead.id ? result.lead : l));
      }
    } catch (err) {
      console.error('Error removing tag:', err);
    }
  };

  const handleUpdateStatusDropdown = async (statusValue: any) => {
    if (!selectedLead) return;
    try {
      const response = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          status: statusValue
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedLead(result.lead);
        setLeads(prev => prev.map(l => l.id === result.lead.id ? result.lead : l));
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // --- Filter Queues ---
  const filteredLeads = useMemo(() => {
    let list = [...leads];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.phone.includes(q) || 
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.requirements && l.requirements.toLowerCase().includes(q)) ||
        (l.industry && l.industry.toLowerCase().includes(q))
      );
    }

    // Category Tabs Filter
    const todayStr = new Date().toISOString().split('T')[0];
    switch (activeQueueTab) {
      case 'queue':
        // Active assigned leads waiting to be called or closed
        return list.filter(l => !['Closed Won', 'Closed Lost'].includes(l.status));
      case 'today':
        // Scheduled for today or called today
        return list.filter(l => {
          const calledToday = l.lastCalled && l.lastCalled.startsWith(todayStr);
          const scheduledToday = l.followUps?.some(f => f.dateTime?.startsWith(todayStr) && !f.completed);
          const meetingToday = l.meetings?.some(m => m.dateTime?.startsWith(todayStr) && m.status === 'Scheduled');
          return calledToday || scheduledToday || meetingToday;
        });
      case 'scheduled':
        // Has pending follow-up triggers
        return list.filter(l => l.followUps?.some(f => !f.completed) || l.meetings?.some(m => m.status === 'Scheduled'));
      case 'callback':
        // Leads with direct callback scheduled or marked as callback
        return list.filter(l => l.status === 'Nurturing' || l.followUps?.some(f => f.title.toLowerCase().includes('callback') && !f.completed));
      case 'missed':
        // Busy, No Answer or Missed triggers
        return list.filter(l => ['Contacted', 'Not Interested'].includes(l.status) && !l.lastCalled);
      case 'completed':
        // Success wins or archived
        return list.filter(l => ['Closed Won', 'Closed Lost'].includes(l.status));
      default:
        return list;
    }
  }, [leads, activeQueueTab, searchQuery]);

  // Combined Activities Timeline generator
  const mergedTimeline = useMemo(() => {
    if (!selectedLead) return [];
    
    const timelineEvents: {
      id: string;
      type: 'call' | 'journey' | 'notes' | 'followup' | 'meeting' | 'document';
      title: string;
      desc: string;
      timestamp: string;
      user: string;
      meta?: any;
    }[] = [];

    // Lead creation event
    timelineEvents.push({
      id: 'creation',
      type: 'journey',
      title: 'Lead Registered',
      desc: selectedLead.requirements || 'Created profile in CRM.',
      timestamp: selectedLead.createdAt || new Date().toISOString(),
      user: 'CRM System'
    });

    // Historic Journey Events
    if (selectedLead.journey) {
      selectedLead.journey.forEach((evt, idx) => {
        timelineEvents.push({
          id: `journey-${idx}`,
          type: 'journey',
          title: `Status Changed: ${evt.status}`,
          desc: evt.notes || 'No remarks provided.',
          timestamp: evt.timestamp,
          user: evt.updatedBy || 'Staff'
        });
      });
    }

    // Call Logs associated with this lead
    const matchingCalls = callLogs.filter(c => c.leadId === selectedLead.id);
    matchingCalls.forEach(call => {
      timelineEvents.push({
        id: call.id,
        type: 'call',
        title: `Outbound Call (${call.status})`,
        desc: call.notes || 'No call logging notes.',
        timestamp: call.timestamp,
        user: call.telecallerName,
        meta: { duration: call.duration, hasRecording: call.hasRecording, recordingId: call.recordingId }
      });
    });

    // Scratchpad notes
    if (selectedLead.notesList) {
      selectedLead.notesList.forEach(note => {
        timelineEvents.push({
          id: note.id,
          type: 'notes',
          title: 'Manual Scratchpad Log',
          desc: note.text,
          timestamp: note.timestamp,
          user: note.author
        });
      });
    }

    // Follow ups
    if (selectedLead.followUps) {
      selectedLead.followUps.forEach(f => {
        timelineEvents.push({
          id: f.id,
          type: 'followup',
          title: `Follow-up Event ${f.completed ? '✓' : '⏰'}`,
          desc: f.title,
          timestamp: f.dateTime + ':00Z',
          user: user.name,
          meta: { completed: f.completed }
        });
      });
    }

    // Meetings
    if (selectedLead.meetings) {
      selectedLead.meetings.forEach(m => {
        timelineEvents.push({
          id: m.id,
          type: 'meeting',
          title: `Client Meeting Scheduled (${m.status})`,
          desc: `${m.title} @ Location: ${m.location}`,
          timestamp: m.dateTime + ':00Z',
          user: m.createdBy || user.name
        });
      });
    }

    // Documents
    if (selectedLead.documents) {
      selectedLead.documents.forEach(doc => {
        timelineEvents.push({
          id: doc.id,
          type: 'document',
          title: 'Document Attachment Uploaded',
          desc: `${doc.name} (File Size: ${doc.size})`,
          timestamp: doc.uploadedAt,
          user: user.name
        });
      });
    }

    // Sort chronologically (latest first)
    return timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedLead, callLogs]);

  return (
    <div className="flex flex-col h-screen bg-slate-50/70 overflow-hidden font-sans text-slate-800">
      
      {/* 🚀 UPPER BRAND HEADER RAIL */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/10 flex items-center justify-center text-white">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Enterprise Telecalling Workspace
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-100">
                HubSphere Voice Cloud
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Assigned Executive: <strong className="text-slate-800">{user.name}</strong> • Real-time Cloud Dialer & CRM Sync Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-bold border border-emerald-100 shadow-sm shadow-emerald-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AGENT ONLINE
          </div>

          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition duration-150 cursor-pointer"
            title="Force refresh database sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 cursor-pointer"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </header>

      {/* 💻 MAIN TRIAL PANEL GRID WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ==========================================
            1. LEFT PANEL: CUSTOMER QUEUES & FILTERS
           ========================================== */}
        <aside className="w-80 border-r border-slate-200/80 bg-white/75 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
          
          {/* Quick Queue Category Tabs */}
          <div className="p-4 pb-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search phone, name, industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-150"
              />
            </div>
          </div>

          {/* Scrolling Tab Controls */}
          <div className="px-4 py-3 border-b border-slate-100 flex gap-1 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
            {[
              { id: 'queue', label: 'Queue', count: leads.filter(l => !['Closed Won', 'Closed Lost'].includes(l.status)).length },
              { id: 'today', label: 'Today', count: leads.filter(l => l.lastCalled?.startsWith(new Date().toISOString().split('T')[0])).length || 0 },
              { id: 'scheduled', label: 'Scheduled', count: leads.filter(l => l.followUps?.some(f => !f.completed)).length || 0 },
              { id: 'callback', label: 'Callbacks', count: leads.filter(l => l.status === 'Nurturing').length },
              { id: 'missed', label: 'Missed', count: leads.filter(l => ['Contacted'].includes(l.status) && !l.lastCalled).length },
              { id: 'completed', label: 'Completed', count: leads.filter(l => ['Closed Won', 'Closed Lost'].includes(l.status)).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveQueueTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition duration-150 shrink-0 cursor-pointer ${
                  activeQueueTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label} <span className="opacity-70 font-bold ml-0.5">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Render List of Leads */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Syncing Assigned Leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">No clients match this criteria</p>
                <p className="text-[10px] text-slate-400 leading-snug">There are no leads registered in this calling category yet.</p>
              </div>
            ) : (
              filteredLeads.map(lead => {
                const isSelected = selectedLead?.id === lead.id;
                
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'New': return <Badge variant="info">New</Badge>;
                    case 'Interested': return <Badge variant="success">Interested</Badge>;
                    case 'Spoke': return <Badge variant="default">Spoke</Badge>;
                    case 'Not Interested': return <Badge variant="danger">Not Interested</Badge>;
                    case 'Closed Won': return <Badge variant="royal">Won 🎉</Badge>;
                    default: return <Badge variant="warning">{status}</Badge>;
                  }
                };

                const getPriorityDot = (p: string) => {
                  if (p === 'High') return 'bg-red-500 ring-2 ring-red-100';
                  if (p === 'Medium') return 'bg-amber-500 ring-2 ring-amber-100';
                  return 'bg-blue-400 ring-2 ring-blue-100';
                };

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      if (callState === 'connected' || callState === 'ringing') {
                        alert('You are currently inside an active call. Please disconnect before switching clients.');
                        return;
                      }
                      setSelectedLead(lead);
                    }}
                    className={`p-4 text-left transition duration-150 cursor-pointer flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-l-4 border-blue-600' 
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${getPriorityDot(lead.priority || 'Medium')}`} />
                        <h4 className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                          {lead.name}
                        </h4>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">
                        {lead.lastCalled ? new Date(lead.lastCalled).toLocaleDateString() : 'Never Called'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium truncate">
                      🏢 {lead.requirements?.slice(0, 45) || 'No core requirements specified.'}
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-slate-400 font-bold font-mono">
                        📞 {lead.phone}
                      </span>
                      {getStatusBadge(lead.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ==========================================
            2. CENTER WORKSPACE: DYNAMIC DIALPAD & ACTIVE CALL SCREEN
           ========================================== */}
        <main className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50/20 p-6 overflow-y-auto flex flex-col gap-6">
          
          {selectedLead ? (
            <>
              {/* Dynamic Customer Stats Header Card */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/10">
                      {selectedLead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900">{selectedLead.name}</h2>
                        <Badge variant={selectedLead.priority === 'High' ? 'danger' : selectedLead.priority === 'Medium' ? 'warning' : 'info'}>
                          {selectedLead.priority || 'Medium'} Priority
                        </Badge>
                        <select
                          value={selectedLead.status}
                          onChange={(e) => handleUpdateStatusDropdown(e.target.value)}
                          className="bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-0.5 outline-none focus:border-blue-500"
                        >
                          <option value="New">Stage: New</option>
                          <option value="Interested">Stage: Interested</option>
                          <option value="Spoke">Stage: Spoke</option>
                          <option value="Nurturing">Stage: Nurturing</option>
                          <option value="Closed Won">Stage: Closed Won</option>
                          <option value="Closed Lost">Stage: Closed Lost</option>
                        </select>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-3 flex-wrap">
                        <span>🏢 {selectedLead.requirements || 'No Company info'}</span>
                        <span>•</span>
                        <span>📩 {selectedLead.email || 'No email registered'}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-800">📞 {selectedLead.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* High level metrics */}
                  <div className="flex gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="text-center md:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Est. Deal Value</span>
                      <strong className="text-sm font-black text-slate-800 font-mono">
                        ₹{(selectedLead.dealValue || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div className="text-center md:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total Sessions</span>
                      <strong className="text-sm font-black text-slate-800 font-mono">
                        {callLogs.filter(c => c.leadId === selectedLead.id).length} calls
                      </strong>
                    </div>
                  </div>

                </div>

                {/* Tag List Section */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Tags:
                  </span>
                  {(selectedLead.tags || []).map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 transition duration-150 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                      title="Click to remove tag"
                    >
                      {tag} ✕
                    </span>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      placeholder="+ Add Tag" 
                      value={newTagText}
                      onChange={(e) => setNewTagText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="bg-slate-50 text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-0.5 w-20 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>

              {/* ==========================================
                  DOCK 1: ENTERPRISE VOICE CONTROL CONSOLE & DIALPAD
                 ========================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Visual Dialpad / Call Status (lg: span 7) */}
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                  
                  {/* Connection Header Bar */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span>SIP Softphone Console</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Live Call Quality Indicator */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">Quality</span>
                        <div className="flex gap-0.5 items-end h-3">
                          <span className={`w-0.5 h-1.5 rounded-full ${networkQuality !== 'poor' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span className={`w-0.5 h-2 rounded-full ${networkQuality !== 'poor' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span className={`w-0.5 h-3 rounded-full ${networkQuality === 'excellent' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">
                          {networkQuality === 'excellent' ? 'Excellent' : networkQuality === 'good' ? 'Good' : 'Poor Latency'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Dial Screen Display */}
                  <div className="bg-slate-900 rounded-2xl p-6 text-center text-white relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>
                    
                    {callState === 'idle' ? (
                      <div className="py-6 space-y-2">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">Outbound Dial Pad</span>
                        <input
                          type="text"
                          placeholder="Dial number or select client..."
                          value={dialedNumber || selectedLead.phone}
                          onChange={(e) => setDialedNumber(e.target.value)}
                          className="bg-transparent border-b border-slate-800 text-white font-mono text-xl font-bold tracking-widest text-center outline-none w-full max-w-[220px] pb-1 focus:border-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 font-medium">Auto-populates from selected customer card.</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-4">
                        <div className="flex justify-center items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${callState === 'ringing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                            {callState === 'ringing' ? 'Ringing Client...' : callState === 'on_hold' ? 'Call on Hold' : 'Call Connected'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-black">{selectedLead.name}</h3>
                          <span className="text-xs text-slate-400 font-mono mt-1 block">
                            {selectedLead.phone} ({selectedLead.requirements?.slice(0, 20)}...)
                          </span>
                        </div>

                        {/* Connection Timer Stopwatch */}
                        <div className="text-3xl font-black text-white font-mono flex items-center justify-center gap-2 bg-slate-950/60 w-max mx-auto px-6 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
                          <Clock className="w-5 h-5 text-orange-500 animate-pulse" />
                          {Math.floor(callTimer / 60).toString().padStart(2, '0')}:
                          {(callTimer % 60).toString().padStart(2, '0')}
                        </div>

                        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            REC Live
                          </span>
                          <span>•</span>
                          <span>Stereo Channel Audio</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dialer Keypad Layout */}
                  <div className="grid grid-cols-3 gap-3 font-mono text-slate-800 max-w-[280px] mx-auto">
                    {[
                      { num: '1', sub: 'Q' }, { num: '2', sub: 'ABC' }, { num: '3', sub: 'DEF' },
                      { num: '4', sub: 'GHI' }, { num: '5', sub: 'JKL' }, { num: '6', sub: 'MNO' },
                      { num: '7', sub: 'PQRS' }, { num: '8', sub: 'TUV' }, { num: '9', sub: 'WXYZ' },
                      { num: '*', sub: 'P' }, { num: '0', sub: '+' }, { num: '#', sub: 'S' }
                    ].map(key => (
                      <button
                        key={key.num}
                        type="button"
                        onClick={() => handleKeypadPress(key.num)}
                        disabled={callState !== 'idle'}
                        className="bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-800 py-3 rounded-xl border border-slate-200/60 font-black text-base transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center shadow-sm"
                      >
                        <span>{key.num}</span>
                        <span className="text-[7px] text-slate-400 font-normal">{key.sub}</span>
                      </button>
                    ))}
                  </div>

                  {/* Premium Action Controls (Call / Hold / Mute / Speaker / Record etc.) */}
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-4 gap-3">
                    
                    <button
                      onClick={() => setIsMuted(prev => !prev)}
                      disabled={callState === 'idle'}
                      className={`p-3 rounded-xl border transition-all duration-150 text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer ${
                        isMuted 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      Mute
                    </button>

                    <button
                      onClick={handleToggleHold}
                      disabled={callState === 'idle' || callState === 'ringing'}
                      className={`p-3 rounded-xl border transition-all duration-150 text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer ${
                        callState === 'on_hold' 
                          ? 'bg-amber-50 text-amber-600 border-amber-200' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Pause className="w-4 h-4" />
                      {callState === 'on_hold' ? 'Resume' : 'Hold'}
                    </button>

                    <button
                      onClick={() => setIsSpeakerOn(prev => !prev)}
                      disabled={callState === 'idle'}
                      className={`p-3 rounded-xl border transition-all duration-150 text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer ${
                        isSpeakerOn 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {isSpeakerOn ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                      Speaker
                    </button>

                    <button
                      onClick={() => {
                        if (callState === 'idle') return;
                        setIsRecording(prev => !prev);
                      }}
                      disabled={callState === 'idle'}
                      className={`p-3 rounded-xl border transition-all duration-150 text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer ${
                        isRecording 
                          ? 'bg-red-50 text-red-600 border-red-200' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Square className={`w-4 h-4 ${isRecording ? 'animate-pulse text-red-500' : ''}`} />
                      Record
                    </button>

                  </div>

                  {/* Primary Dial / Hang Up Button */}
                  <div className="flex gap-3">
                    {callState === 'idle' ? (
                      <button
                        onClick={handleStartCall}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-xs transition duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
                      >
                        <Phone className="w-4 h-4" />
                        Place Outbound Call (कॉल लगाएं)
                      </button>
                    ) : (
                      <button
                        onClick={handleEndCall}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl text-xs transition duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-500/15"
                      >
                        <PhoneOff className="w-4 h-4" />
                        Disconnect Call (कॉल काटें)
                      </button>
                    )}
                  </div>

                </div>

                {/* Live Notes Scratchpad Panel (lg: span 5) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-left">
                  
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-500" /> Live Interaction Notes
                    </span>
                    
                    <button
                      onClick={handleAppendTimestamp}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" /> Auto Timestamp
                    </button>
                  </div>

                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    Type and organize client requests, pricing notes or specific parameters raised during this session:
                  </p>

                  <textarea
                    value={liveNotes}
                    onChange={(e) => setLiveNotes(e.target.value)}
                    placeholder="Enter discussion logs, requested quotes, size or volume requirements... (e.g., Client requested 3000 custom cardboard boxes by Friday, price quoted ₹28 per box)"
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-150 resize-none leading-relaxed text-slate-700"
                  />

                  {/* Notes configuration footer */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsStarred(prev => !prev)}
                        className={`p-2 rounded-xl border transition duration-150 ${
                          isStarred 
                            ? 'bg-amber-50 text-amber-500 border-amber-200' 
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Mark conversation as highly important"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowTeamMention(prev => !prev)}
                          className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl text-xs transition duration-150"
                          title="Tag/Mention department members"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        {showTeamMention && (
                          <div className="absolute left-0 bottom-12 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-30 w-48 space-y-1">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b pb-1 mb-1">Mention Colleague</p>
                            {['@Admin', '@SalesHead', '@TechSupport'].map(mention => (
                              <button
                                key={mention}
                                onClick={() => {
                                  setLiveNotes(prev => prev + ' ' + mention);
                                  setShowTeamMention(false);
                                }}
                                className="w-full text-left text-xs text-slate-600 hover:bg-slate-50 p-1 rounded-md"
                              >
                                {mention}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveNotes}
                      disabled={!liveNotes}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/10 transition duration-150 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Notes Only
                    </button>
                  </div>

                </div>

              </div>

              {/* ==========================================
                  DOCK 2: ACTION PANELS & SCHEDULE CALENDAR
                 ========================================== */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Schedule Next Action / Follow-up Calendar Integration</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Follow Up Metadata form */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action Description</label>
                    <input 
                      type="text" 
                      value={followUpTitle}
                      onChange={(e) => setFollowUpTitle(e.target.value)}
                      placeholder="E.g., Review Quote & Pricing negotiation"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                        <input 
                          type="date" 
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time</label>
                        <input 
                          type="time" 
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channel & Assignment Selector */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Action Channel Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'call', label: '📞 Call' },
                        { id: 'meeting', label: '🤝 Meeting' },
                        { id: 'task', label: '📝 Task' }
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFollowUpType(type.id as any)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition duration-150 ${
                            followUpType === type.id 
                              ? 'bg-blue-50 border-blue-300 text-blue-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Owner Assignment</label>
                      <input 
                        type="text" 
                        value={followUpOwner}
                        onChange={(e) => setFollowUpOwner(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Calendar details */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Google Calendar Sync</span>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed">
                        Setting a follow-up action auto-propositions Google Calendar invites and updates the CRM lead timeline automatically.
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Calendar Integration Ready
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-12 text-center text-slate-500 max-w-xl mx-auto space-y-3">
              <Users className="w-12 h-12 text-slate-300 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Select a customer from the left queue</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Click any of your assigned customer cards in the sidebar list to load their 360 profile, timeline history, and trigger outbound Voice SIP sessions.
              </p>
            </div>
          )}

        </main>

        {/* ==========================================
            3. RIGHT PANEL: CUSTOMER 360 DETAIL TABS
           ========================================== */}
        <aside className="w-96 border-l border-slate-200/80 bg-white/75 backdrop-blur-md flex flex-col shrink-0 overflow-hidden text-left">
          
          {selectedLead ? (
            <>
              {/* Profile Head */}
              <div className="p-4 border-b border-slate-200/80 shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center text-blue-600 font-black text-xs shadow-sm">
                    360
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">CRM Profile Intelligence</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Comprehensive historic journey & customer detail ledger</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tab selection */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
                {[
                  { id: 'profile', label: 'Overview' },
                  { id: 'timeline', label: 'History & Timeline' },
                  { id: 'ai_insights', label: 'AI Ready Insights' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRightTab(tab.id as any)}
                    className={`flex-1 py-3 text-center text-[11px] font-bold transition duration-150 relative cursor-pointer ${
                      activeRightTab === tab.id 
                        ? 'text-blue-600 font-black' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                    {activeRightTab === tab.id && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                    )}
                  </button>
                ))}
              </div>

              {/* Dynamic Scrolling Container for Tabs */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 📋 TAB: PROFILE */}
                {activeRightTab === 'profile' && (
                  <div className="space-y-4 animate-fade-in text-slate-700">
                    
                    {/* Organization details */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-900 font-bold uppercase tracking-wider border-b pb-1.5">
                        <Building className="w-4 h-4 text-blue-600" /> Organization Parameters
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Industry Sect</span>
                          <strong className="text-slate-700">{selectedLead.industry || 'Technology'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Company Size</span>
                          <strong className="text-slate-700">{selectedLead.companySize || '11-50 employees'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Website Link</span>
                          {selectedLead.website ? (
                            <a href={selectedLead.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5 font-bold">
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">Not provided</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">GST Regist. No</span>
                          <strong className="text-slate-700 font-mono uppercase">{selectedLead.gst || 'No GST linked'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Geolocation Details card */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-900 font-bold uppercase tracking-wider border-b pb-1.5">
                        <MapPin className="w-4 h-4 text-orange-500" /> Geography & Address
                      </div>

                      <div className="space-y-2 text-xs leading-relaxed">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Physical Address</span>
                          <strong className="text-slate-700 block mt-0.5 font-medium leading-relaxed">
                            {selectedLead.address || 'No physical address registered.'}
                          </strong>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">City</span>
                            <strong className="text-slate-700 font-bold">{selectedLead.city || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">State</span>
                            <strong className="text-slate-700 font-bold">{selectedLead.state || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Country</span>
                            <strong className="text-slate-700 font-bold">{selectedLead.country || 'N/A'}</strong>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">ZIP Code / PIN</span>
                          <strong className="text-slate-700 font-mono font-bold tracking-wider">{selectedLead.pin || 'N/A'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Quick Metadata ledger */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs space-y-2 leading-relaxed">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Source campaign</span>
                        <strong className="text-slate-700">{selectedLead.source || 'Website Query'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Assigned on</span>
                        <strong className="text-slate-700">
                          {selectedLead.assignedAt ? new Date(selectedLead.assignedAt).toLocaleDateString() : 'Direct Import'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Profile Created</span>
                        <strong className="text-slate-700">
                          {new Date(selectedLead.createdAt).toLocaleDateString()}
                        </strong>
                      </div>
                    </div>

                  </div>
                )}

                {/* 📋 TAB: TIMELINE HISTORY */}
                {activeRightTab === 'timeline' && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Historic Event Trail</span>

                    {mergedTimeline.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 space-y-1">
                        <Activity className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold">No timeline trail logged yet</p>
                      </div>
                    ) : (
                      <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-5">
                        {mergedTimeline.map((evt, idx) => {
                          
                          const getTimelineIcon = (type: string) => {
                            switch (type) {
                              case 'call': return <Phone className="w-3 h-3 text-emerald-600" />;
                              case 'notes': return <FileText className="w-3 h-3 text-amber-600" />;
                              case 'followup': return <Clock className="w-3 h-3 text-orange-600" />;
                              case 'meeting': return <Users className="w-3 h-3 text-blue-600" />;
                              case 'document': return <Paperclip className="w-3 h-3 text-indigo-600" />;
                              default: return <Sparkles className="w-3 h-3 text-blue-500" />;
                            }
                          };

                          const getTimelineBg = (type: string) => {
                            switch (type) {
                              case 'call': return 'bg-emerald-50 border-emerald-200';
                              case 'notes': return 'bg-amber-50 border-amber-200';
                              case 'followup': return 'bg-orange-50 border-orange-200';
                              case 'meeting': return 'bg-blue-50 border-blue-200';
                              case 'document': return 'bg-indigo-50 border-indigo-200';
                              default: return 'bg-slate-50 border-slate-200';
                            }
                          };

                          return (
                            <div key={evt.id + '-' + idx} className="relative group">
                              {/* Dot Icon indicator */}
                              <span className={`absolute -left-[31px] top-1 w-5.5 h-5.5 rounded-full border ${getTimelineBg(evt.type)} flex items-center justify-center bg-white shadow-sm transition-all`} >
                                {getTimelineIcon(evt.type)}
                              </span>

                              <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/40 p-3.5 rounded-xl space-y-1.5 transition duration-150">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                                    {evt.title}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {new Date(evt.timestamp).toLocaleString()}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                  {evt.desc}
                                </p>

                                {evt.meta?.duration && (
                                  <div className="text-[9px] font-bold text-emerald-600">
                                    ⏱ Call Session Duration: {evt.meta.duration}s
                                  </div>
                                )}

                                <div className="text-[9px] text-slate-400 font-bold bg-white p-1 px-2 rounded border border-slate-200/40 w-max">
                                  👤 Owner: <span className="text-slate-600">{evt.user}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}

                {/* 📋 TAB: AI READY PLACEHOLDERS */}
                {activeRightTab === 'ai_insights' && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2.5">
                      <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <strong className="text-blue-900 block font-bold uppercase tracking-wider text-[10px]">AI Co-Pilot Assistant</strong>
                        <p className="text-blue-700 leading-relaxed mt-0.5">
                          HubSphere AI Engine predicts conversion rates, identifies sentiment thresholds, and generates intelligent pitches.
                        </p>
                      </div>
                    </div>

                    {/* AI LEAD SCORE PLACEHOLDER */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider">Predictive Lead Score</span>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-100 uppercase">HIGH LIKELIHOOD</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-blue-500/20 bg-blue-50">
                          {/* Circle Indicator placeholder */}
                          <span className="text-lg font-black text-blue-600">82%</span>
                        </div>
                        <div className="text-xs leading-relaxed text-slate-600">
                          <p className="font-semibold text-slate-800">Strong Business Interest Indicator</p>
                          <p className="mt-0.5">Historical activity suggests high conversion chance due to quick response times and firm size constraints.</p>
                        </div>
                      </div>
                    </div>

                    {/* AI SENTIMENT METER */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                      <span className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider block">Customer Sentiment Trend</span>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Neutral / Positive Tone</span>
                          <span className="text-emerald-600">92% Positive</span>
                        </div>
                        {/* Progress bar placeholder */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 h-full w-[92%]"></div>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed">
                          Speech pace and word vocabulary from previous callbacks indicate positive brand trust and standard budget allocation.
                        </p>
                      </div>
                    </div>

                    {/* AI PITCH RECOMMENDATIONS */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm text-xs text-slate-600">
                      <span className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider block">Suggested Pitch Playbook</span>
                      
                      <ul className="space-y-2 list-disc pl-4 text-[11px] leading-relaxed">
                        <li>Focus pitch on <strong className="text-slate-800 font-bold">bulk volume pricing tier discounts</strong>.</li>
                        <li>Highlight the <strong className="text-slate-800 font-bold">48-hour rapid dispatch guarantee</strong> to counter logistics risks.</li>
                        <li>Leverage the box packaging design portfolio.</li>
                      </ul>
                    </div>

                    {/* AI NEXT ACTION SUGGESTIONS */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm text-xs">
                      <span className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider block">AI Best Next-Action Suggestion</span>
                      <p className="text-slate-600 leading-relaxed">
                        "Schedule the follow-up meeting on <strong className="text-slate-800 font-bold">Friday afternoon between 3:00 PM and 5:00 PM IST</strong>. Historic business records reveal Indian SME decision makers are 64% more likely to close deals during weekend review sessions."
                      </p>
                    </div>

                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-1.5 flex flex-col items-center justify-center h-full">
              <Building className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-bold">No profile loaded</p>
            </div>
          )}

        </aside>

      </div>

      {/* ==========================================
          MODAL: CALL OUTCOME DISPOSITION POPUP (MANDATORY REMARKS)
         ========================================== */}
      {showDispositionModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-scale-up">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Log Call Disposition Outcome</h3>
                <p className="text-xs text-slate-500 mt-1">Please record conversation parameters to update status and advance CRM stages.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitDisposition} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              
              {/* Outcome status dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Conversation Result (कॉल का परिणाम)</label>
                <select
                  value={dispositionOutcome}
                  onChange={(e) => setDispositionOutcome(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:bg-white focus:border-blue-500 transition duration-150"
                >
                  <option value="Interested">Interested (रुचि दिखाई)</option>
                  <option value="Follow-up">Follow-up Scheduled (आगे बात होगी)</option>
                  <option value="Callback">Callback Request (कॉल बैक अनुरोध)</option>
                  <option value="No Answer">No Answer / Out of Coverage (कॉल नहीं उठाया)</option>
                  <option value="Busy">Busy / Waiting (व्यस्त / बाद में कॉल करें)</option>
                  <option value="Wrong Number">Wrong Number (गलत नंबर)</option>
                  <option value="Not Interested">Not Interested (रुचि नहीं है)</option>
                  <option value="Converted">Closed Won (डील फाइनल हुई 🎉)</option>
                  <option value="Lost">Closed Lost (डील खारिज हुई 📉)</option>
                </select>
              </div>

              {/* Deal value update input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Opportunity Deal Value (डील का मूल्य - ₹)</label>
                <input
                  type="number"
                  value={dispositionDealValue || ''}
                  onChange={(e) => setDispositionDealValue(Number(e.target.value))}
                  placeholder="Enter estimated contract or deal size (e.g., ₹25,000)"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs outline-none focus:bg-white focus:border-blue-500 transition duration-150"
                />
              </div>

              {/* Mandatory remarks */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mandatory Call Remarks (कॉल रिमार्क्स)</label>
                  <span className="text-[10px] text-red-500 font-bold">REQUIRED</span>
                </div>
                <textarea
                  required
                  value={dispositionRemarks}
                  onChange={(e) => setDispositionRemarks(e.target.value)}
                  placeholder="Enter call notes or next action pitch... (Min 5 words. E.g., Customer requested box catalog. Interested in 5000 units bulk packaging.)"
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3.5 text-xs outline-none focus:bg-white focus:border-blue-500 transition duration-150 resize-none font-medium leading-relaxed"
                />
                <p className="text-[10px] text-slate-400">Remarks will be pinned to this customer's public and internal timeline logs.</p>
              </div>

              {/* Next Follow up info */}
              {['Follow-up', 'Callback', 'Interested'].includes(dispositionOutcome) && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
                  <span className="text-[10px] text-orange-700 font-black uppercase tracking-wider block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Follow-up Action Scheduled
                  </span>
                  <p className="text-[10.5px] text-orange-600 leading-relaxed">
                    Selected follow-up action triggers calendar invites on {followUpDate || 'Selected date'} at {followUpTime || 'Selected time'}. Adjust the timeline or close the popup.
                  </p>
                </div>
              )}

              {/* Submit / Cancel row */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCallState('idle');
                    setShowDispositionModal(false);
                  }}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDisposition || !dispositionRemarks.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 font-bold rounded-xl text-xs shadow-lg shadow-blue-500/15 transition duration-150 cursor-pointer flex items-center gap-1"
                >
                  {savingDisposition ? 'Logging Sync...' : 'Save & Load Next Client'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
