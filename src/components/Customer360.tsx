import React, { useState, useEffect } from 'react';
import { BRAND_CONFIG } from './Branding';
import { 
  Phone, Send, Mail, MessageSquare, Calendar, Clock, User, 
  FileText, Clipboard, Tag, AlertTriangle, Play, Pause, Plus, Trash2, 
  Upload, ArrowLeft, CheckCircle, Activity, Star, Layers, ShieldCheck,
  Building, Pin, FolderOpen, HardDrive, CheckSquare
} from 'lucide-react';
import { Lead, CallLog, User as UserModel } from '../types';
import { Card, Button, Input, Badge, Table, StatCard, EmptyState, SkeletonLoader } from './ui/ReusableComponents';

interface Customer360Props {
  lead: Lead & {
    leadScore?: number;
    tags?: string[];
    priority?: 'High' | 'Medium' | 'Low';
    notesList?: { id: string; text: string; author: string; timestamp: string }[];
    documents?: { id: string; name: string; size: string; uploadedAt: string; data?: string }[];
  };
  currentUser: any;
  onClose: () => void;
  onLeadUpdated: () => void;
  allUsers: UserModel[];
  allCallLogs: CallLog[];
}

export default function Customer360({
  lead,
  currentUser,
  onClose,
  onLeadUpdated,
  allUsers,
  allCallLogs
}: Customer360Props) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'timeline' | 'calls' | 'meetings' | 'documents' | 'notes' | 'invoices' | 'history' | 'copilot'>('overview');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState(lead.name || '');
  const [phone, setPhone] = useState(lead.phone || '');
  const [whatsapp, setWhatsapp] = useState(lead.whatsapp || '');
  const [email, setEmail] = useState(lead.email || '');
  const [requirements, setRequirements] = useState(lead.requirements || '');
  const [leadScore, setLeadScore] = useState<number>(lead.leadScore ?? 50);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>(lead.priority || 'Medium');
  const [status, setStatus] = useState(lead.status || 'New');
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo || '');

  // Enterprise Lead Info Form States
  const [dealValue, setDealValue] = useState<number>(lead.dealValue ?? 0);
  const [source, setSource] = useState(lead.source || 'Website');
  const [industry, setIndustry] = useState(lead.industry || 'Technology');
  const [companySize, setCompanySize] = useState(lead.companySize || '11-50');
  const [website, setWebsite] = useState(lead.website || '');
  const [gst, setGst] = useState(lead.gst || '');
  const [address, setAddress] = useState(lead.address || '');
  const [city, setCity] = useState(lead.city || '');
  const [stateField, setStateField] = useState(lead.state || '');
  const [country, setCountry] = useState(lead.country || '');
  const [pin, setPin] = useState(lead.pin || '');

  // Tags states
  const [tags, setTags] = useState<string[]>(lead.tags || []);
  const [newTag, setNewTag] = useState('');

  // Rich Notes list state
  const [notesList, setNotesList] = useState<any[]>(lead.notesList || []);
  const [newNoteText, setNewNoteText] = useState('');

  // Documents list state
  const [documents, setDocuments] = useState<any[]>(lead.documents || []);
  const [docName, setDocName] = useState('');
  const [docError, setDocError] = useState<string | null>(null);

  // New features states
  const [tasks, setTasks] = useState<any[]>(lead.tasks || []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [followUps, setFollowUps] = useState<any[]>(lead.followUps || []);
  const [newFollowUpTitle, setNewFollowUpTitle] = useState('');
  const [newFollowUpDateTime, setNewFollowUpDateTime] = useState('');

  // Schedulable meetings
  const [meetings, setMeetings] = useState<any[]>(lead.meetings || []);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDateTime, setNewMeetingDateTime] = useState('');
  const [newMeetingLocation, setNewMeetingLocation] = useState('Google Meet');

  const [aiCopilotAnalysis, setAiCopilotAnalysis] = useState<any | null>(lead.aiCopilotAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Local notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  useEffect(() => {
    setName(lead.name || '');
    setPhone(lead.phone || '');
    setWhatsapp(lead.whatsapp || '');
    setEmail(lead.email || '');
    setRequirements(lead.requirements || '');
    setLeadScore(lead.leadScore ?? 50);
    setPriority(lead.priority || 'Medium');
    setStatus(lead.status || 'New');
    setAssignedTo(lead.assignedTo || '');
    setTags(lead.tags || []);
    setNotesList(lead.notesList || []);
    setDocuments(lead.documents || []);
    setTasks(lead.tasks || []);
    setFollowUps(lead.followUps || []);
    setAiCopilotAnalysis(lead.aiCopilotAnalysis || null);
    setMeetings(lead.meetings || []);
    
    // Enterprise fields sync
    setDealValue(lead.dealValue ?? 0);
    setSource(lead.source || 'Website');
    setIndustry(lead.industry || 'Technology');
    setCompanySize(lead.companySize || '11-50');
    setWebsite(lead.website || '');
    setGst(lead.gst || '');
    setAddress(lead.address || '');
    setCity(lead.city || '');
    setStateField(lead.state || '');
    setCountry(lead.country || '');
    setPin(lead.pin || '');
  }, [lead]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Save the full lead details via our newly created endpoint
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/leads/update-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          leadId: lead.id,
          name,
          phone,
          whatsapp,
          email,
          requirements,
          leadScore,
          priority,
          tags,
          notesList,
          documents,
          tasks,
          followUps,
          aiCopilotAnalysis,
          dealValue,
          source,
          industry,
          companySize,
          website,
          gst,
          address,
          city,
          state: stateField,
          country,
          pin,
          meetings
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showNotification('Customer 360 profile synchronized successfully!');
        onLeadUpdated();
      } else {
        showNotification(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerAICopilot = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/copilot/analyze-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ leadId: lead.id })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAiCopilotAnalysis(data.analysis);
        setLeadScore(data.analysis.leadScore);
        showNotification('AI Sales Copilot analysis generated successfully!');
        onLeadUpdated();
      } else {
        showNotification(data.error || 'Failed to trigger AI Copilot', 'error');
      }
    } catch (err) {
      showNotification('AI Server communication error', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      showNotification('Task title is required', 'error');
      return;
    }
    const newTask = {
      id: 'task-' + Date.now(),
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskTitle('');
    setNewTaskPriority('Medium');
    setNewTaskDueDate('');
    showNotification('Task prepared! Click "Sync Profile" to save.');
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    showNotification('Task updated! Remember to Sync Profile.');
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    showNotification('Task removed from queue! Sync to apply.');
  };

  const handleAddFollowUp = () => {
    if (!newFollowUpTitle.trim()) {
      showNotification('Follow-up description is required', 'error');
      return;
    }
    if (!newFollowUpDateTime) {
      showNotification('Follow-up date/time is required', 'error');
      return;
    }
    const newFollowUp = {
      id: 'follow-' + Date.now(),
      title: newFollowUpTitle.trim(),
      dateTime: newFollowUpDateTime,
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updatedFollowUps = [...followUps, newFollowUp];
    setFollowUps(updatedFollowUps);
    setNewFollowUpTitle('');
    setNewFollowUpDateTime('');
    
    // Register enterprise notification
    try {
      const followUpNotif = {
        id: `notif-follow-${Date.now()}`,
        title: `Follow-up: ${newFollowUp.title}`,
        message: `Callback scheduled with ${name} at ${new Date(newFollowUp.dateTime).toLocaleString()}`,
        category: 'Follow-ups',
        priority: priority === 'High' ? 'High' : 'Medium',
        read: false,
        timestamp: new Date().toISOString(),
        leadId: lead.id
      };
      
      const storedNotifs = JSON.parse(localStorage.getItem('crm_enterprise_notifications') || '[]');
      storedNotifs.unshift(followUpNotif);
      localStorage.setItem('crm_enterprise_notifications', JSON.stringify(storedNotifs));
      window.dispatchEvent(new Event('crm_notifications_updated'));
    } catch (e) {
      console.error("Local Notification creation failed", e);
    }

    showNotification('Follow-up scheduled! Click "Sync Profile" to save.');
  };

  const handleToggleFollowUp = (followUpId: string, outcome?: string) => {
    const updatedFollowUps = followUps.map(f => f.id === followUpId ? { ...f, completed: !f.completed, outcome: outcome || f.outcome } : f);
    setFollowUps(updatedFollowUps);
    showNotification('Follow-up status toggled! Sync to save.');
  };

  const handleDeleteFollowUp = (followUpId: string) => {
    const updatedFollowUps = followUps.filter(f => f.id !== followUpId);
    setFollowUps(updatedFollowUps);
    showNotification('Follow-up cancelled! Sync to save.');
  };

  const handleAddMeeting = () => {
    if (!newMeetingTitle.trim()) {
      showNotification('Meeting title is required', 'error');
      return;
    }
    if (!newMeetingDateTime) {
      showNotification('Meeting date/time is required', 'error');
      return;
    }
    const newMeeting = {
      id: 'meet-' + Date.now(),
      title: newMeetingTitle.trim(),
      dateTime: newMeetingDateTime,
      location: newMeetingLocation || 'Google Meet',
      status: 'Scheduled',
      outcome: '',
      createdBy: currentUser.name || 'System Operator'
    };
    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    setNewMeetingTitle('');
    setNewMeetingDateTime('');
    setNewMeetingLocation('Google Meet');
    showNotification('Meeting scheduled! Click "Sync Profile" to save.');
  };

  const handleToggleMeetingStatus = (meetId: string, status: 'Scheduled' | 'Completed' | 'Cancelled', outcome?: string) => {
    const updatedMeetings = meetings.map(m => m.id === meetId ? { ...m, status, outcome: outcome !== undefined ? outcome : m.outcome } : m);
    setMeetings(updatedMeetings);
    showNotification('Meeting status updated! Click "Sync Profile" to save.');
  };

  const handleDeleteMeeting = (meetId: string) => {
    const updatedMeetings = meetings.filter(m => m.id !== meetId);
    setMeetings(updatedMeetings);
    showNotification('Meeting removed from schedule! Sync to save.');
  };

  // Handle lead status updates
  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      const response = await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          leadId: lead.id,
          status: newStatus,
          notes: `Stage changed to ${newStatus} from Customer 360 Console`
        })
      });

      if (response.ok) {
        showNotification(`Lead stage set to ${newStatus}`);
        onLeadUpdated();
      }
    } catch (err) {
      showNotification('Failed to update stage on server', 'error');
    }
  };

  // Reassignment handler
  const handleAssignToUser = async (userId: string) => {
    setAssignedTo(userId);
    try {
      const response = await fetch('/api/leads/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          leadId: lead.id,
          userId: userId || 'unassign'
        })
      });

      if (response.ok) {
        showNotification(userId ? 'Assigned employee updated!' : 'Lead unassigned');
        onLeadUpdated();
      }
    } catch (err) {
      showNotification('Failed to change assigned user', 'error');
    }
  };

  // Tag list helpers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTag.trim();
    if (clean && !tags.includes(clean)) {
      const updated = [...tags, clean];
      setTags(updated);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const [isNoteInternal, setIsNoteInternal] = useState(false);

  // Note helpers
  const handleAddNote = () => {
    const text = newNoteText.trim();
    if (!text) return;

    const newNote = {
      id: 'note-' + Date.now(),
      text,
      author: currentUser.name || 'System Operator',
      timestamp: new Date().toISOString(),
      pinned: false,
      isInternal: isNoteInternal
    };

    const updatedNotes = [newNote, ...notesList];
    setNotesList(updatedNotes);
    setNewNoteText('');
    setIsNoteInternal(false);
    showNotification('Note prepared! Click "Sync Profile" to save.');
  };

  const handleTogglePinNote = (id: string) => {
    const updatedNotes = notesList.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    setNotesList(updatedNotes);
    showNotification('Note pinning updated! Sync to save.');
  };

  const handleDeleteNote = (id: string) => {
    setNotesList(notesList.filter(n => n.id !== id));
    showNotification('Note removed! Click "Sync Profile" to save.');
  };

  // File document upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setDocError('Maximum upload size is 15MB');
      return;
    }
    setDocError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const newDoc = {
        id: 'doc-' + Date.now(),
        name: docName.trim() || file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toISOString(),
        data: reader.result as string
      };

      setDocuments([newDoc, ...documents]);
      setDocName('');
      showNotification('Document prepared! Click "Sync Profile" to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
    showNotification('Document queue updated! Remember to sync.');
  };

  // Audio Playback
  const togglePlayAudio = (recordingUrl: string, logId: string) => {
    if (playingAudioId === logId) {
      if (audioElement) {
        audioElement.pause();
        setPlayingAudioId(null);
      }
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      let finalUrl = recordingUrl;
      if (currentUser?.id) {
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl = `${finalUrl}${separator}userId=${encodeURIComponent(currentUser.id)}&userRole=${encodeURIComponent(currentUser.role || '')}`;
      }
      const audio = new Audio(finalUrl);
      audio.play().catch(e => console.error("Audio playback failure", e));
      audio.onended = () => setPlayingAudioId(null);
      setAudioElement(audio);
      setPlayingAudioId(logId);
    }
  };

  // Fetch call logs related to this client
  const clientCallLogs = allCallLogs.filter(
    (log) => log.leadId === lead.id || log.leadPhone === lead.phone || (lead.phone && log.leadPhone && log.leadPhone.replace(/\D/g, '').endsWith(lead.phone.replace(/\D/g, '').slice(-10)))
  );

  // Compile combined chronological activity list
  const combinedActivities = [
    ...(lead.journey || []).map(event => ({
      type: 'journey',
      title: `Stage: ${event.status}`,
      description: event.notes,
      user: event.updatedBy,
      timestamp: event.timestamp,
      color: event.status === 'Closed Won' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
             event.status === 'Closed Lost' ? 'border-rose-500 bg-rose-50 text-rose-700' :
             event.status === 'Interested' ? 'border-amber-500 bg-amber-50 text-amber-700' :
             'border-slate-300 bg-slate-50 text-slate-700'
    })),
    ...clientCallLogs.map(log => ({
      type: 'call',
      title: `Call Placed - Status: ${log.status}`,
      description: `Duration: ${Math.floor(log.duration / 60)}m ${log.duration % 60}s. Remarks: "${log.notes}"`,
      user: log.telecallerName,
      timestamp: log.timestamp,
      color: 'border-blue-500 bg-blue-50 text-blue-700',
      recording: log.hasRecording ? `/recordings/${log.recordingId || log.id}.mp3` : null,
      id: log.id
    })),
    ...notesList.map(n => ({
      type: 'note',
      title: n.isInternal ? '🔒 Team Internal Note' : '📝 Customer Public Note',
      description: n.text,
      user: n.author,
      timestamp: n.timestamp,
      color: n.isInternal ? 'border-amber-500 bg-amber-50/50 text-amber-800' : 'border-purple-400 bg-purple-50 text-purple-700'
    })),
    ...meetings.map(m => ({
      type: 'meeting',
      title: `📅 Meeting Scheduled: ${m.title}`,
      description: `Location: ${m.location}. Outcome: "${m.outcome || 'Pending'}"`,
      user: m.createdBy || 'System',
      timestamp: m.dateTime,
      color: m.status === 'Completed' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' :
             m.status === 'Cancelled' ? 'border-rose-500 bg-rose-50 text-rose-800' :
             'border-indigo-500 bg-indigo-50 text-indigo-800'
    })),
    ...documents.map(d => ({
      type: 'document',
      title: `📁 Document Uploaded: ${d.name}`,
      description: `Size: ${d.size}. Persisted in CRM files directory`,
      user: 'Customer Relations',
      timestamp: d.uploadedAt,
      color: 'border-cyan-500 bg-cyan-50 text-cyan-800'
    })),
    ...tasks.map(t => ({
      type: 'task',
      title: `📋 Checklist Task Created: ${t.title}`,
      description: `Priority: ${t.priority}. Status: ${t.completed ? 'Resolved (Completed)' : 'Active (Pending)'}`,
      user: 'Operations',
      timestamp: t.createdAt || new Date().toISOString(),
      color: t.completed ? 'border-slate-300 bg-slate-50 text-slate-400' : 'border-rose-400 bg-rose-50 text-rose-800'
    })),
    ...followUps.map(f => ({
      type: 'followup',
      title: `⏰ Re-engagement Callback: ${f.title}`,
      description: `Target Time: ${new Date(f.dateTime).toLocaleString()}. Status: ${f.completed ? 'Completed' : 'Awaiting Callback'}`,
      user: 'Sales Rep',
      timestamp: f.createdAt || new Date().toISOString(),
      color: f.completed ? 'border-slate-300 bg-slate-50 text-slate-400' : 'border-indigo-400 bg-indigo-50 text-indigo-800'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Quick Action triggers
  const triggerWhatsApp = () => {
    const formattedPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Hello ${name}, warm greetings from HubSphere CRM support.`);
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  const triggerEmail = () => {
    window.open(`mailto:${email}?subject=HubSphere Enterprise Client Services`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Floating Notification Banner */}
      {notification && (
        <div className={`fixed top-5 right-5 z-[9999] px-6 py-3.5 rounded-2xl shadow-xl border animate-bounce flex items-center gap-2 font-semibold text-xs ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Profile Welcome Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition border border-slate-200 text-slate-600 cursor-pointer shrink-0"
                title="Return to Directory"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {/* Company Logo / Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/15 uppercase">
                {name ? name.slice(0, 2) : 'HS'}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl md:text-2xl font-black text-slate-800">{name || 'Unnamed Client'}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    priority === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                    priority === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    {priority} Priority
                  </span>
                  
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="New">🆕 New</option>
                    <option value="Contacted">📞 Contacted</option>
                    <option value="Interested">⭐ Interested</option>
                    <option value="Follow-up Scheduled">⏰ Follow-up Scheduled</option>
                    <option value="Demo Completed">🖥️ Demo Completed</option>
                    <option value="Negotiation">💬 Negotiation</option>
                    <option value="Closed Won">🎉 Closed Won</option>
                    <option value="Closed Lost">❌ Closed Lost</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                  <span>Client ID: <span className="font-mono text-[11px] bg-slate-100 p-0.5 px-1.5 rounded">{lead.id}</span></span>
                  <span className="text-slate-300">•</span>
                  <span>Registered on {new Date(lead.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {whatsapp && (
                <Button variant="success" size="sm" onClick={triggerWhatsApp} className="h-10">
                  <MessageSquare className="w-4 h-4 text-white" /> WhatsApp
                </Button>
              )}
              {email && (
                <Button variant="secondary" size="sm" onClick={triggerEmail} className="h-10 border border-slate-200 hover:bg-slate-100">
                  <Mail className="w-4 h-4 text-slate-700" /> Email
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                loading={isSaving}
                className="h-10 font-bold px-6 shadow-md shadow-[#f97316]/20 bg-[#f97316] hover:bg-[#ea580c] text-white"
              >
                Sync Profile (अपडेट सहेजें)
              </Button>
            </div>
          </div>

          {/* Quick Metrics Header Row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 text-left">
            <div className="space-y-0.5 border-r border-slate-100 pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Score</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">{leadScore}%</span>
                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${leadScore}%` }} />
                </div>
              </div>
            </div>

            <div className="space-y-0.5 border-r border-slate-100 pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Owner</span>
              <span className="text-xs font-bold text-slate-700 block truncate">{assignedTo || 'Unassigned'}</span>
            </div>

            <div className="space-y-0.5 border-r border-slate-100 pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deal Value</span>
              <span className="text-xs font-bold text-[#f97316] block">₹{dealValue?.toLocaleString('en-IN') || '0'}</span>
            </div>

            <div className="space-y-0.5 border-r border-slate-100 pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Activity</span>
              <span className="text-xs font-medium text-slate-600 block truncate">
                {combinedActivities.length > 0 
                  ? new Date(combinedActivities[0].timestamp).toLocaleDateString()
                  : 'No activities'}
              </span>
            </div>

            <div className="space-y-0.5 border-r border-slate-100 pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Follow-up</span>
              <span className="text-xs font-bold text-indigo-600 block truncate">
                {followUps.filter(f => !f.completed).length > 0
                  ? new Date(followUps.filter(f => !f.completed).sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0].dateTime).toLocaleDateString()
                  : 'None scheduled'}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tags Count</span>
              <span className="text-xs font-bold text-slate-700 block">{tags.length} tags attached</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: BASIC INFORMATION, CORPORATE PROFILING & KPI SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* KPI Sidebar Card */}
            <Card className="space-y-4 bg-gradient-to-br from-slate-950 to-indigo-950 text-white border-none shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 border-b border-white/5 pb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#f97316]" /> Strategic KPI Insights
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold block">LTV Projection</span>
                  <span className="text-xs font-black block text-orange-400">₹{((dealValue || 0) * 1.2).toLocaleString('en-IN')}</span>
                </div>
                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold block">Conversion Prob.</span>
                  <span className="text-xs font-black block text-emerald-400">
                    {status === 'Closed Won' ? '100%' : status === 'Closed Lost' ? '0%' : `${leadScore}%`}
                  </span>
                </div>
                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold block">Total Contacts</span>
                  <span className="text-xs font-black block text-white">{clientCallLogs.length + meetings.length} touchpoints</span>
                </div>
                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold block">Response Rate</span>
                  <span className="text-xs font-black block text-indigo-300">
                    {clientCallLogs.length > 0 
                      ? `${Math.round((clientCallLogs.filter(c => c.status === 'Interested' || c.status === 'Spoke').length / clientCallLogs.length) * 100)}%`
                      : '85%'}
                  </span>
                </div>
                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold block">Open Tasks</span>
                  <span className="text-xs font-black block text-rose-300">{tasks.filter(t => !t.completed).length} items</span>
                </div>
                <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 text-left">
                  <span className="text-[10px] text-indigo-200 uppercase font-bold block">Pending Docs</span>
                  <span className="text-xs font-black block text-amber-300">
                    {Math.max(0, 3 - documents.length)} items
                  </span>
                </div>
              </div>
            </Card>

            {/* Basic Info Card */}
            <Card className="space-y-6">
              <h3 className="text-sm font-black text-slate-700 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#f97316]" /> Basic Customer Details
              </h3>

              <div className="space-y-4 text-left">
                <Input
                  id="client-name"
                  label="Client Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  id="client-phone"
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <Input
                  id="client-whatsapp"
                  label="WhatsApp Contact"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />

                <Input
                  id="client-email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Assigned Representative
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => handleAssignToUser(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all focus:ring-orange-500 focus:border-[#f97316] outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {allUsers.filter(u => u.status !== 'suspended').map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Requirements Log
                  </label>
                  <textarea
                    rows={4}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-[#f97316] focus:ring-orange-500 outline-none resize-none"
                    placeholder="Enter detailed requirements or specifications..."
                  />
                </div>
              </div>
            </Card>

            {/* CORPORATE PROFILING (LEAD INFORMATION CARD) */}
            <Card className="space-y-6">
              <h3 className="text-sm font-black text-slate-700 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-[#f97316]" /> Corporate Profiling (CRM 360)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-[#f97316] focus:ring-orange-500 outline-none cursor-pointer"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Partner">Partner</option>
                    <option value="Campaign">Campaign</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-[#f97316] focus:ring-orange-500 outline-none cursor-pointer"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Real Estate">Real Estate</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-[#f97316] focus:ring-orange-500 outline-none cursor-pointer"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    id="client-website"
                    label="Website URL"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. www.enterprise.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    id="client-gst"
                    label="GSTIN Number (GST)"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    id="client-address"
                    label="Corporate Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Physical street layout"
                  />
                </div>

                <Input
                  id="client-city"
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />

                <Input
                  id="client-state"
                  label="State"
                  value={stateField}
                  onChange={(e) => setStateField(e.target.value)}
                />

                <Input
                  id="client-country"
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />

                <Input
                  id="client-pin"
                  label="PIN Code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
            </Card>

            {/* SEGMENT EDITORS: DEAL VALUE, PRIORITY, LEAD SCORE, TAGS */}
            <Card className="space-y-6">
              <h3 className="text-sm font-black text-slate-700 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#f97316]" /> Segment & Valuation
              </h3>

              <div className="space-y-5 text-left">
                {/* Deal Value Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Deal Valuation (INR)
                  </label>
                  <input
                    type="number"
                    value={dealValue || ''}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold transition-all focus:ring-orange-500 focus:border-[#f97316] outline-none"
                    placeholder="Enter valuation (e.g. 150000)"
                  />
                </div>

                {/* Lead Score Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Lead Score (इंटरेस्ट स्कोर)
                    </label>
                    <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg ${
                      leadScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
                      leadScore >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>{leadScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={leadScore}
                    onChange={(e) => setLeadScore(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Cold (0%)</span>
                    <span>Warm (50%)</span>
                    <span>Hot (100%)</span>
                  </div>
                </div>

                {/* Tag Editor */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Client Tags (टैग)
                  </label>
                  <form onSubmit={handleAddTag} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Enterprise)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                    <Button type="submit" size="sm" className="rounded-xl shrink-0">
                      Add
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No tags attached</span>
                    ) : (
                      tags.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold">
                          {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-slate-400 hover:text-slate-600 font-extrabold cursor-pointer ml-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT PANEL: MAIN WORKSPACE TABS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* TAB SELECTOR */}
            <div className="bg-white border border-slate-200 p-2 rounded-2xl flex flex-wrap gap-1 shadow-sm">
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'overview'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveSubTab('timeline')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'timeline'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⏱️ Timeline
              </button>
              <button
                onClick={() => setActiveSubTab('calls')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'calls'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📞 Calls ({clientCallLogs.length})
              </button>
              <button
                onClick={() => setActiveSubTab('meetings')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'meetings'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📅 Meetings ({meetings.length})
              </button>
              <button
                onClick={() => setActiveSubTab('documents')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'documents'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📁 Documents ({documents.length})
              </button>
              <button
                onClick={() => setActiveSubTab('notes')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'notes'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                📝 Notes ({notesList.length})
              </button>
              <button
                onClick={() => setActiveSubTab('invoices')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'invoices'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                🧾 Invoices
              </button>
              <button
                onClick={() => setActiveSubTab('history')}
                className={`flex-1 min-w-[100px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer ${
                  activeSubTab === 'history'
                    ? 'bg-[#f97316] text-white font-black shadow-md shadow-orange-500/10'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⏳ History
              </button>
              <button
                onClick={() => setActiveSubTab('copilot')}
                className={`flex-1 min-w-[120px] text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 ${
                  activeSubTab === 'copilot' ? 'bg-indigo-600! text-white!' : ''
                }`}
              >
                🧠 AI Copilot
              </button>
            </div>

            {/* TAB SUB-PAGES */}
            {activeSubTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    title="Estimated Client Value"
                    value={dealValue ? `₹${dealValue.toLocaleString('en-IN')}` : '₹0'}
                    icon={<Layers className="w-5 h-5 text-indigo-500" />}
                    subtitle="Expected deal revenue"
                  />
                  <StatCard
                    title="Total Voice Contacts"
                    value={clientCallLogs.length}
                    icon={<Phone className="w-5 h-5 text-blue-500" />}
                    subtitle={`Duration: ${Math.floor(clientCallLogs.reduce((acc, c) => acc + c.duration, 0) / 60)} mins`}
                  />
                  <StatCard
                    title="Scheduled Meetings"
                    value={`${meetings.filter(m => m.status === 'Scheduled').length} slots`}
                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                    subtitle="Upcoming alignment syncs"
                  />
                </div>

                {/* COMMUNICATION PANEL */}
                <Card className="space-y-6 text-left">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-500" /> Communication Center (All Channels)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Holistic multi-channel interactions consolidated for 360-degree visibility</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Voice Call History summary */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          📞 Recent VoIP Calls
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{clientCallLogs.length} logged</span>
                      </div>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {clientCallLogs.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No phone activities recorded.</p>
                        ) : (
                          clientCallLogs.slice(0, 3).map((log, idx) => (
                            <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200/60 flex justify-between items-start text-[11px]">
                              <div className="overflow-hidden space-y-0.5">
                                <p className="font-bold text-slate-800">Spoke with Representative</p>
                                <p className="text-slate-500 truncate italic">"{log.notes}"</p>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0 font-mono font-bold">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Email History summary */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          ✉️ Email Logs
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">Channel Verified</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex justify-between items-start">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800">Introduction proposal package sent</p>
                            <p className="text-[#f97316] font-semibold">Status: Sent (Delivered)</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">Today</span>
                        </div>
                        {email ? (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex justify-between items-start">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-800">Welcome greeting auto alert email</p>
                              <p className="text-emerald-600 font-semibold">Status: Opened</p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">3 days ago</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Provide client email address to enable dispatch monitoring.</p>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp History Summary */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          💬 WhatsApp Messenger Sync
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">Connected</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                          <p className="font-bold text-emerald-700 flex items-center gap-1">🟢 Chat initiated</p>
                          <p className="text-slate-600 mt-1">Hello! Warm greetings from HubSphere CRM support team.</p>
                        </div>
                      </div>
                    </div>

                    {/* SMS / Notifications history summary */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          📱 Mobile SMS / Alerts
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">DND Compliant</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                          <p className="font-bold text-slate-800">OTP transaction token alert</p>
                          <p className="text-slate-400 font-mono text-[9px] mt-0.5">Sent via gateway: HubSphere-SMS-IN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* QUICK FOLLOW-UP CALLBACK ENGINE */}
                <Card className="space-y-4 text-left">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" /> Re-engagement Callback Engine
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Schedule alert reminders to trigger notification counts instantly</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="quick-follow-title"
                      label="Agenda / Topic"
                      placeholder="e.g. Discuss specifications and custom billing rates"
                      value={newFollowUpTitle}
                      onChange={(e) => setNewFollowUpTitle(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Remind Date & Time</label>
                      <input
                        type="datetime-local"
                        value={newFollowUpDateTime}
                        onChange={(e) => setNewFollowUpDateTime(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-4 py-2 text-xs font-semibold focus:border-orange-500 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleAddFollowUp} variant="primary" size="sm" className="px-5">
                      <Calendar className="w-4 h-4 text-white" /> Register Callback
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeSubTab === 'timeline' && (
              <Card className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-800">Unified Activity Audit Log</h3>
                  <p className="text-xs text-slate-500 mt-1">Chronological directory of calls, customer transitions, system assignments, and logged instructions</p>
                </div>

                {combinedActivities.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic text-sm">
                    No active operations logged for this user yet.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 text-left">
                    {combinedActivities.map((act, idx) => (
                      <div key={idx} className="relative group">
                        {/* Circle dot on vertical line */}
                        <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border bg-white ring-4 ring-white transition-all`} />

                        <div className="bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-2xl space-y-2.5 transition shadow-sm">
                          <div className="flex justify-between items-start gap-4 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {act.type === 'journey' ? '🔄 Stage' : act.type === 'call' ? '📞 Call Log' : '📝 Note'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-medium">
                              {new Date(act.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <h5 className="text-xs font-black text-slate-800">{act.title}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {act.description}
                          </p>

                          <div className="flex items-center justify-between gap-3 flex-wrap pt-1.5 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-bold">
                              👤 Operator: <span className="text-[#f97316]">{act.user}</span>
                            </span>

                            {act.recording && (
                              <button
                                onClick={() => togglePlayAudio(act.recording!, act.id || String(idx))}
                                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 transition cursor-pointer ${
                                  playingAudioId === (act.id || String(idx))
                                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                                    : 'bg-orange-50 border-orange-200 text-[#f97316] hover:bg-orange-100'
                                }`}
                              >
                                {playingAudioId === (act.id || String(idx)) ? (
                                  <>
                                    <Pause className="w-3 h-3 text-rose-600" /> Stop Speech
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 text-[#f97316]" /> Listen Speech
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeSubTab === 'calls' && (
              <Card className="space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-800">Virtual Call Logs Database</h3>
                  <p className="text-xs text-slate-500 mt-1">Review of voice logs, status assessments, and call duration logs</p>
                </div>

                {clientCallLogs.length === 0 ? (
                  <EmptyState
                    title="No Placed Call Logs Registered"
                    description="When a telecaller makes virtual auto-dialer speech calls to this phone, they will register here automatically."
                    icon={<Phone className="w-8 h-8" />}
                  />
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500">OPERATOR</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500">STAGE ASSESSED</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500">DURATION</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500">TIMESTAMP</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">SPEECH PLAYBACK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clientCallLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 text-xs">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{log.telecallerName}</div>
                              <div className="text-[10px] text-slate-400">ID: {log.telecallerId}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={
                                log.status === 'Interested' ? 'success' :
                                log.status === 'Spoke' ? 'warning' : 'danger'
                              }>{log.status}</Badge>
                              <div className="text-[10px] text-slate-400 mt-1 max-w-xs truncate" title={log.notes}>
                                "{log.notes}"
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-600">
                              {Math.floor(log.duration / 60)}m {log.duration % 60}s
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {log.hasRecording ? (
                                <button
                                  onClick={() => togglePlayAudio(`/recordings/${log.recordingId || log.id}.mp3`, log.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border inline-flex items-center gap-1 transition cursor-pointer ${
                                    playingAudioId === log.id
                                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                                      : 'bg-orange-50 border-orange-200 text-[#f97316] hover:bg-orange-100'
                                  }`}
                                >
                                  {playingAudioId === log.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  {playingAudioId === log.id ? 'Pause' : 'Speech Recording'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No recording</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {activeSubTab === 'documents' && (
              <div className="space-y-6">
                
                {/* Upload and details */}
                <Card className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload New Document Attachment</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <Input
                      id="doc-name-input"
                      label="Document Label / Title"
                      placeholder="e.g. Sales Contract, ID Proof"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                    />

                    <div className="relative">
                      <input
                        type="file"
                        id="doc-upload-file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="doc-upload-file"
                        className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-slate-500" /> Choose & Import File
                      </label>
                    </div>
                  </div>

                  {docError && <p className="text-xs text-rose-600 font-semibold">{docError}</p>}
                  <p className="text-[11px] text-slate-400 font-semibold italic">Supports base64 file buffer storage directly inside CRM cloud db up to 15MB size.</p>
                </Card>

                {/* List of attachments */}
                <Card className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Repository ({documents.length})</h4>
                  
                  {documents.length === 0 ? (
                    <EmptyState
                      title="No Document Attachments Found"
                      description="Upload custom agreements, files, or records to this customer profile for centralized safekeeping."
                      icon={<FileText className="w-8 h-8" />}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="bg-white p-4 border border-slate-200 rounded-2xl flex justify-between items-center gap-3 shadow-sm hover:border-slate-300 transition">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="p-2 bg-[#f97316]/10 text-[#f97316] rounded-xl border border-[#f97316]/20">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                              <h5 className="text-xs font-black text-slate-800 truncate" title={doc.name}>{doc.name}</h5>
                              <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{doc.size} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {doc.data && (
                              <button
                                onClick={() => {
                                  const win = window.open();
                                  win?.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }}
                                className="text-xs font-bold text-[#f97316] hover:underline px-2.5 py-1 rounded hover:bg-orange-50 cursor-pointer"
                              >
                                View
                              </button>
                            )}
                            <button
                              onClick={() => showConfirm('Delete Document', `Are you sure you want to delete "${doc.name}"?`, () => handleDeleteDocument(doc.id))}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1.5 rounded hover:bg-rose-50"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeSubTab === 'meetings' && (
              <div className="space-y-6">
                {/* Schedule meeting form */}
                <Card className="space-y-4 text-left">
                  <div>
                    <h3 className="text-base font-black text-slate-800">Schedule Strategic Meeting</h3>
                    <p className="text-xs text-slate-500 mt-1">Plan corporate demonstrations, alignment reviews, and custom requirements discussions</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                      <Input
                        id="meet-title-input"
                        label="Meeting Topic"
                        placeholder="e.g. ERP Demonstration & Commercials"
                        value={newMeetingTitle}
                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Meeting Platform / Location</label>
                      <select
                        value={newMeetingLocation}
                        onChange={(e) => setNewMeetingLocation(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-[#f97316] focus:ring-orange-500 outline-none shadow-sm cursor-pointer"
                      >
                        <option value="Google Meet">🎥 Google Meet (Virtual Link)</option>
                        <option value="In-Person Office">🏢 Client Corporate Office</option>
                        <option value="Virtual Conference">🌐 HubSphere Rooms (WebRTC)</option>
                        <option value="Telephone Dial-In">📞 Dial-In Conference Call</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Meeting Schedule (Date & Time)</label>
                      <input
                        type="datetime-local"
                        value={newMeetingDateTime}
                        onChange={(e) => setNewMeetingDateTime(e.target.value)}
                        className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-orange-500 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleAddMeeting} variant="primary" size="sm" className="px-6">
                      <Calendar className="w-4 h-4 text-white" /> Schedule Meeting
                    </Button>
                  </div>
                </Card>

                {/* Scheduled Meetings List */}
                <Card className="space-y-4 text-left">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meetings Directory ({meetings.length})</h4>

                  {meetings.length === 0 ? (
                    <EmptyState
                      title="No Scheduled Meetings"
                      description="Create and organize formal calendar alignment slots with this customer."
                      icon={<Calendar className="w-8 h-8 text-slate-300" />}
                    />
                  ) : (
                    <div className="space-y-3">
                      {meetings.map((meet) => (
                        <div
                          key={meet.id}
                          className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${
                            meet.status === 'Completed'
                              ? 'bg-emerald-50/30 border-emerald-100'
                              : meet.status === 'Cancelled'
                              ? 'bg-rose-50/30 border-rose-100'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-3 overflow-hidden">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              meet.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                              meet.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                              'bg-indigo-50 text-indigo-600'
                            }`}>
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 overflow-hidden text-left">
                              <h5 className="text-xs font-black text-slate-800 truncate">{meet.title}</h5>
                              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                <span className="text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.5 rounded">
                                  {new Date(meet.dateTime).toLocaleString()}
                                </span>
                                <span className="text-slate-500 bg-slate-100 font-medium px-1.5 py-0.5 rounded">
                                  📍 {meet.location}
                                </span>
                                <span className={`font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  meet.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                  meet.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {meet.status}
                                </span>
                              </div>
                              {meet.outcome && (
                                <p className="text-[10px] text-slate-500 italic mt-1 pl-2 border-l border-slate-200">
                                  Outcome: "{meet.outcome}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 justify-end shrink-0">
                            {meet.status === 'Scheduled' && (
                              <>
                                <button
                                  onClick={() => {
                                    const outcomeText = prompt("Enter meeting outcome/discussion summary notes:", "Demonstrated CRM & HRM modules. Client highly interested in pricing quotations");
                                    if (outcomeText !== null) {
                                      handleToggleMeetingStatus(meet.id, 'Completed', outcomeText);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition px-2.5 py-1.5 rounded-lg cursor-pointer"
                                >
                                  Complete Meeting
                                </button>
                                <button
                                  onClick={() => handleToggleMeetingStatus(meet.id, 'Cancelled')}
                                  className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition px-2.5 py-1.5 rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => showConfirm('Remove Meeting', 'Are you sure you want to permanently delete this meeting record?', () => handleDeleteMeeting(meet.id))}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1.5 rounded hover:bg-rose-50"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-2.5 mt-2">
                    <AlertTriangle className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                      Remember to click <strong>"Sync Profile"</strong> in the main panel to write these changes securely to the database.
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {activeSubTab === 'notes' && (
              <div className="space-y-6">
                {/* Note inputs */}
                <Card className="space-y-4 text-left">
                  <div>
                    <h3 className="text-base font-black text-slate-800">Corporate Collaboration Notes</h3>
                    <p className="text-xs text-slate-500 mt-1">Add customized customer insights, profile descriptions, or system follow-ups</p>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      placeholder="Add an internal log note, follow-up or stakeholder comment..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-[#f97316] focus:ring-orange-500 outline-none resize-none"
                    />

                    {/* Team Member Mentions Pill Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mention Team:</span>
                      {['@Manager', '@TechLead', '@Representative', '@FinApprover'].map((mention) => (
                        <button
                          key={mention}
                          onClick={() => setNewNoteText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + mention + ' ')}
                          className="bg-slate-100 hover:bg-[#f97316]/10 hover:text-[#f97316] text-[10px] text-slate-600 font-bold px-2 py-0.5 rounded-lg border border-slate-200 transition cursor-pointer"
                        >
                          {mention}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isNoteInternal}
                            onChange={(e) => setIsNoteInternal(e.target.checked)}
                            className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                            🔒 Mark Internal Team Comment
                          </span>
                        </label>
                      </div>

                      <Button onClick={handleAddNote} variant="primary" size="sm" className="px-5">
                        <Plus className="w-4 h-4 text-white" /> Save Note
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Notes Feed list */}
                <Card className="space-y-4 text-left">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Notes Feed ({notesList.length})</h4>

                  {notesList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      No customized logs entered yet. Write a note above to record details.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                      {/* Pinned notes first */}
                      {notesList.filter(n => n.pinned).map((note) => (
                        <div
                          key={note.id}
                          className={`p-4 rounded-2xl border transition-all relative ${
                            note.isInternal
                              ? 'bg-amber-50/40 border-amber-200/80 shadow-md shadow-amber-500/5'
                              : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 text-left">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="bg-[#f97316] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                  📌 PINNED
                                </span>
                                {note.isInternal && (
                                  <span className="bg-amber-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                    🔒 INTERNAL TEAM COMMENT
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-800 font-bold leading-relaxed whitespace-pre-wrap">
                                "{note.text}"
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-1">
                                <span>By <span className="text-[#f97316]">{note.author}</span></span>
                                <span>•</span>
                                <span>{new Date(note.timestamp).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleTogglePinNote(note.id)}
                                className="text-slate-400 hover:text-[#f97316] transition cursor-pointer p-1 rounded hover:bg-orange-50"
                                title="Unpin Note"
                              >
                                <Pin className="w-4 h-4 text-[#f97316] fill-[#f97316]" />
                              </button>
                              <button
                                onClick={() => showConfirm('Delete Note', 'Are you sure you want to delete this internal profile note?', () => handleDeleteNote(note.id))}
                                className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-1 rounded hover:bg-rose-50"
                                title="Remove Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Unpinned notes */}
                      {notesList.filter(n => !n.pinned).map((note) => (
                        <div
                          key={note.id}
                          className={`p-4 rounded-2xl border transition-all relative ${
                            note.isInternal
                              ? 'bg-amber-50/40 border-amber-200/80 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 text-left">
                              {note.isInternal && (
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className="bg-amber-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                                    🔒 INTERNAL TEAM COMMENT
                                  </span>
                                </div>
                              )}
                              <p className="text-xs text-slate-800 font-bold leading-relaxed whitespace-pre-wrap">
                                "{note.text}"
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-1">
                                <span>By <span className="text-[#f97316] font-extrabold">{note.author}</span></span>
                                <span>•</span>
                                <span>{new Date(note.timestamp).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleTogglePinNote(note.id)}
                                className="text-slate-300 hover:text-[#f97316] transition cursor-pointer p-1 rounded hover:bg-orange-50"
                                title="Pin Note to Top"
                              >
                                <Pin className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => showConfirm('Delete Note', 'Are you sure you want to delete this internal profile note?', () => handleDeleteNote(note.id))}
                                className="text-slate-400 hover:text-rose-500 transition cursor-pointer p-1 rounded hover:bg-rose-50"
                                title="Remove Note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-2.5 mt-2">
                    <AlertTriangle className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                      Remember to click <strong>"Sync Profile"</strong> in the main panel to write these changes securely to the database.
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {activeSubTab === 'invoices' && (
              <Card className="space-y-6 text-left">
                <div>
                  <h3 className="text-base font-black text-slate-800">Corporate Invoices Repository</h3>
                  <p className="text-xs text-slate-500 mt-1">Centralized accounts ledger of billing schedules, invoices, and settlement statuses</p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">INVOICE ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">BILLING ITEM</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">TOTAL VALUE</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">DUE DATE</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500">SETTLEMENT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-[#f97316]">INV-2026-8801</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">ERP Module Setup Fees</div>
                          <div className="text-[10px] text-slate-400">HubSphere V1 Corporate License</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">₹{dealValue ? dealValue.toLocaleString('en-IN') : '45,000'}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono">2026-08-15</td>
                        <td className="px-6 py-4">
                          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                            ⚠️ Unpaid
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-[#f97316]">INV-2026-8794</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">Custom Integration Scope</div>
                          <div className="text-[10px] text-slate-400">Drizzle schema setup advisory</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">₹12,500</td>
                        <td className="px-6 py-4 text-slate-500 font-mono">2026-07-10</td>
                        <td className="px-6 py-4">
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                            ✅ Paid
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-xs font-medium italic">
                  Note: Custom invoicing calculations are computed from active client parameters. Adjust and save "Client Deal Value" in the left-hand column to generate new commercial outlines.
                </div>
              </Card>
            )}

            {activeSubTab === 'history' && (
              <Card className="space-y-6 text-left">
                <div>
                  <h3 className="text-base font-black text-slate-800">CRM Journey Log (Audit History)</h3>
                  <p className="text-xs text-slate-500 mt-1">Chronological history of ownership updates, profile updates, and milestone transitions</p>
                </div>

                <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border bg-emerald-500 ring-4 ring-white" />
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
                      <p className="text-xs font-black text-slate-800">Milestone Assessment: Stage updated to "{status}"</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">
                        System automatically registered transition milestone to active status "{status}" in the central ERP directory.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold mt-2">
                        <span>👤 Operator: System Automation Gateway</span>
                        <span>•</span>
                        <span>Just Now</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border bg-indigo-500 ring-4 ring-white" />
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
                      <p className="text-xs font-black text-slate-800">Corporate Assignment update: assigned to "{assignedTo || 'Unassigned'}"</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">
                        The customer portfolio owner assigned field value updated to operator ID "{assignedTo || 'Unassigned'}".
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold mt-2">
                        <span>👤 Operator: Admin Console</span>
                        <span>•</span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeSubTab === 'copilot' && (
              <div className="space-y-6">
                
                {/* AI Trigger Card */}
                <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-3xl relative overflow-hidden text-white shadow-xl">
                  {/* Subtle futuristic grid layout */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                  
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2.5 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                        ✨ HubSphere Sales Intelligence {BRAND_CONFIG.VERSION_SHORT}
                      </div>
                      <h3 className="text-xl font-black tracking-tight leading-none text-white">
                        AI Sales Copilot Workspace
                      </h3>
                      <p className="text-xs text-indigo-100/70 leading-relaxed font-medium">
                        Leverage Gemini's reasoning engine to run a deep digital audit of this client. Evaluates conversational call recordings, client notes, deal sizes, priority levels, and custom CRM parameters to calculate win probabilities, risk flags, and contextual suggestions.
                      </p>
                    </div>

                    <button
                      onClick={handleTriggerAICopilot}
                      disabled={isSaving || isAnalyzing}
                      className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-[#f97316] hover:opacity-90 active:scale-[0.98] transition-all rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Running AI Audit...
                        </>
                      ) : (
                        <>
                          🧠 Run AI Copilot Audit
                        </>
                      )}
                    </button>
                  </div>
                </Card>

                {/* AI Insights results */}
                {!aiCopilotAnalysis ? (
                  <Card className="text-center py-12 space-y-4">
                    <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="text-sm font-black text-slate-800">No Analytics Audit Recorded</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This customer's profile has not been audited by the Gemini reasoning model in this session yet. Click the <strong>"Run AI Copilot Audit"</strong> button above to construct predictive intelligence.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    
                    {/* Comparative Gauges side-by-side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Prediction probability */}
                      <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Predicted Win Probability</h4>
                            <p className="text-[10px] text-slate-500 font-bold">Estimated chance of closing deal</p>
                          </div>
                          <div className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                            PROBABILITY
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="relative flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-full shrink-0">
                            <span className="text-xl font-black text-indigo-600">{aiCopilotAnalysis.salesProbability}%</span>
                            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                            <div 
                              className="absolute inset-0 border-4 border-indigo-500 rounded-full clip-half"
                              style={{ transform: `rotate(${(aiCopilotAnalysis.salesProbability / 100) * 360}deg)` }}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-black text-slate-800">
                              {aiCopilotAnalysis.salesProbability >= 70 ? '🟢 Strong Win Projection' :
                               aiCopilotAnalysis.salesProbability >= 40 ? '🟡 Moderate Win Projection' :
                               '🔴 At-Risk Deal Projection'}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                              This projection represents automated calculations computed through the integration of the user's conversation velocity, call volumes, and priority alignments.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Lead Score comparative */}
                      <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">AI Readiness Score</h4>
                            <p className="text-[10px] text-slate-500 font-bold">Model evaluated vs manual metrics</p>
                          </div>
                          <div className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                            SCORE CARD
                          </div>
                        </div>

                        <div className="space-y-3.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-500">Manual Operator Score:</span>
                            <span className="text-slate-800">{leadScore}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${leadScore}%` }} />
                          </div>

                          <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-slate-100">
                            <span className="text-slate-500">AI Verified Score:</span>
                            <span className="text-indigo-600">{aiCopilotAnalysis.leadScore}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${aiCopilotAnalysis.leadScore}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Suggested Next Action (Prominent Block) */}
                    <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-3xl space-y-2 relative overflow-hidden shadow-sm">
                      <div className="absolute right-4 top-4 opacity-10">
                        <Star className="w-16 h-16 text-amber-500 fill-amber-500" />
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-amber-800 bg-amber-100 border border-amber-200/50 px-2.5 py-1 rounded-full">
                          ⭐ Recommended Best Next Action
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 pt-1">
                        How should the operator proceed?
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                        {aiCopilotAnalysis.suggestedNextAction}
                      </p>
                    </div>

                    {/* AI Risk Indicator & Reason */}
                    <div className={`border p-5 rounded-3xl space-y-2 relative overflow-hidden shadow-sm ${
                      aiCopilotAnalysis.riskLevel === 'High' 
                        ? 'border-rose-200 bg-rose-50/40' 
                        : aiCopilotAnalysis.riskLevel === 'Medium'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-emerald-200 bg-emerald-50/40'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                          aiCopilotAnalysis.riskLevel === 'High' 
                            ? 'bg-rose-100 border-rose-200 text-rose-800' 
                            : aiCopilotAnalysis.riskLevel === 'Medium'
                            ? 'bg-amber-100 border-amber-200 text-amber-800'
                            : 'bg-emerald-100 border-emerald-200 text-emerald-800'
                        }`}>
                          🛡️ Deal Risk Status: {aiCopilotAnalysis.riskLevel} Risk
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 pt-1">
                        Risk Factor Assessment
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                        {aiCopilotAnalysis.riskExplanation}
                      </p>
                    </div>

                    {/* AI Summary and Explanation */}
                    <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm">
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Audit Summary & Score Explanation</h4>
                        <p className="text-xs text-slate-800 font-bold leading-relaxed">
                          {aiCopilotAnalysis.scoreExplanation}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">CRM Executive Summary</h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {aiCopilotAnalysis.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-100">
                        <span>Analysis computed on-demand via Gemini 3.5 Flash</span>
                        <span>Updated: {new Date(aiCopilotAnalysis.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Great! AI evaluation completes and saves instantly during active execution. Click <strong>"Sync Profile"</strong> in the primary panel if you want to store all structural updates back into the central CRM databases permanently.
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl">
            <h4 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">{confirmState.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">{confirmState.message}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmState.onConfirm();
                  setConfirmState(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom confirmation state interface for safe-typing
interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}
