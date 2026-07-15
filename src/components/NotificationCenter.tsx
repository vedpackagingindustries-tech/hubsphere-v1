import React, { useState, useEffect } from 'react';
import { BRAND_CONFIG } from './Branding';
import { Bell, Trash2, Check, Sparkles, AlertCircle, Calendar, Settings, Info } from 'lucide-react';

export interface NotificationItem {
  id: string;
  category: 'Alert' | 'Task' | 'System';
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Alert' | 'Task' | 'System'>('All');
  const [activePriority, setActivePriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  // Load and seed initial notifications if empty
  useEffect(() => {
    const saved = localStorage.getItem('hubsphere_notifications_v1');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        seedInitialNotifications();
      }
    } else {
      seedInitialNotifications();
    }
  }, []);

  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    localStorage.setItem('hubsphere_notifications_v1', JSON.stringify(items));
  };

  const seedInitialNotifications = () => {
    const initial: NotificationItem[] = [
      {
        id: 'notif-1',
        category: 'Alert',
        priority: 'High',
        title: '🔥 High-Priority Lead Assigned',
        message: 'A new high-intent lead (Anand Kumar) has registered with 500 customised corrugated boxes requirements.',
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 mins ago
        read: false
      },
      {
        id: 'notif-2',
        category: 'Task',
        priority: 'Medium',
        title: '📅 Upcoming Callback Due',
        message: 'Outbound callback is due in 10 minutes for client Rajesh Patel regarding price negotiation.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
        read: false
      },
      {
        id: 'notif-3',
        category: 'System',
        priority: 'Low',
        title: '✓ WhatsApp Blast Dispatched',
        message: 'The regional WhatsApp marketing campaign for custom packaging catalog was dispatched successfully.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
        read: true
      },
      {
        id: 'notif-4',
        category: 'Alert',
        priority: 'High',
        title: '⚡ Lead Score Escallation',
        message: 'AI Copilot detected high purchasing activity from Suneeta Sharma. Lead score escalated to 95.',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
        read: false
      }
    ];
    saveNotifications(initial);
  };

  // Simulate real-time supervisor alerts and inbound lead notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // 35% chance to receive a new notification every 60 seconds
      if (Math.random() > 0.65) {
        triggerMockNotification();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [notifications]);

  const triggerMockNotification = (customType?: 'lead' | 'score' | 'alert') => {
    const types = [
      {
        category: 'Alert' as const,
        priority: 'High' as const,
        title: '🚨 Urgent Supervisor Directive',
        message: 'Supervisor requested immediate followup on pending high priority leads in the non-tech segment.'
      },
      {
        category: 'Task' as const,
        priority: 'Medium' as const,
        title: '📞 Scheduled Callback Alert',
        message: 'Callback appointment scheduled with Pooja Verma for graphics cardboard customization.'
      },
      {
        category: 'System' as const,
        priority: 'Low' as const,
        title: '⚙️ Cloud Backup Completed',
        message: 'Weekly automated secure CRM data migration completed successfully at 100% integrity.'
      }
    ];

    let selected: { category: 'Alert' | 'Task' | 'System'; priority: 'High' | 'Medium' | 'Low'; title: string; message: string } = types[Math.floor(Math.random() * types.length)];
    if (customType === 'lead') {
      selected = {
        category: 'Alert',
        priority: 'High',
        title: '🔥 Live Inbound Lead Alert',
        message: 'AI Inbound parser captured a high interest packaging lead on the main corporate portal.'
      };
    } else if (customType === 'score') {
      selected = {
        category: 'Alert',
        priority: 'Medium',
        title: '📈 AI Lead Progression Update',
        message: 'Client engagement analytics indicate an increase in lead probability by 15%.'
      };
    }

    const newNotif: NotificationItem = {
      id: `notif-dyn-${Date.now()}`,
      category: selected.category,
      priority: selected.priority,
      title: selected.title,
      message: selected.message,
      timestamp: new Date().toISOString(),
      read: false
    };

    saveNotifications([newNotif, ...notifications]);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter list
  const filteredNotifications = notifications.filter(n => {
    const matchCat = activeCategory === 'All' || n.category === activeCategory;
    const matchPri = activePriority === 'All' || n.priority === activePriority;
    return matchCat && matchPri;
  });

  const getHumanTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString();
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="relative">
      {/* BELL TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-[#111622] hover:bg-[#1f2635] border border-[#1f2635] hover:border-gray-700 text-gray-300 hover:text-white transition cursor-pointer flex items-center justify-center shadow-md shadow-black/10 focus:outline-none"
      >
        <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 ? 'animate-bounce text-[#f97316]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-pulse ring-2 ring-[#0c0f16]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN OVERLAY CARD */}
      {isOpen && (
        <>
          {/* Transparent Backdrop to close when clicking outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-3 w-96 bg-[#111622] border border-[#1f2635] rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in max-h-[580px]">
            {/* Header */}
            <div className="p-4 bg-[#0d1017] border-b border-[#1f2635] flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-[#f97316]" />
                  Enterprise Notifications
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{unreadCount} unread alerts pending action</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[9px] text-[#f97316] font-bold hover:underline uppercase tracking-wide cursor-pointer bg-[#f97316]/10 px-2 py-1 rounded-md"
                >
                  Mark All Read
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="p-2 bg-[#0e121a] border-b border-[#1f2635] flex gap-1 text-[10px] font-bold">
              {(['All', 'Alert', 'Task', 'System'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#f97316] text-white shadow-md shadow-orange-500/10 font-extrabold'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a202c]'
                  }`}
                >
                  {cat === 'All' ? 'All' : cat === 'Alert' ? '🚨 Alerts' : cat === 'Task' ? '📅 Tasks' : '⚙️ System'}
                </button>
              ))}
            </div>

            {/* Priority Filter Sub-row */}
            <div className="p-2 bg-[#0c0f16]/60 border-b border-[#1f2635] flex gap-2 items-center text-[9px] font-extrabold uppercase text-gray-500 pl-3">
              <span>Priority:</span>
              <div className="flex gap-1.5">
                {(['All', 'High', 'Medium', 'Low'] as const).map(pri => (
                  <button
                    key={pri}
                    onClick={() => setActivePriority(pri)}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      activePriority === pri
                        ? 'bg-gray-700 text-white font-black'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Real-Time Triggers for Demo (AI Sales Ready) */}
            <div className="px-3 py-2 bg-orange-500/5 border-b border-[#1f2635] flex justify-between items-center gap-1">
              <span className="text-[8.5px] text-amber-500 font-extrabold uppercase tracking-wide flex items-center gap-1">
                <Info className="w-3 h-3" /> Real-time Simulation Feed:
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => triggerMockNotification('lead')}
                  className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded hover:bg-emerald-500/20 font-bold"
                >
                  + Lead Alert
                </button>
                <button
                  onClick={() => triggerMockNotification('score')}
                  className="text-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded hover:bg-blue-500/20 font-bold"
                >
                  + AI Score
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1f2635] min-h-[250px]">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-xs">
                  <p className="font-bold">No active notifications</p>
                  <p className="text-[10px] text-gray-600 mt-1">Filtered criteria is completely clear.</p>
                </div>
              ) : (
                filteredNotifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 transition flex gap-3 text-left ${
                      notif.read ? 'bg-[#111622]/40 opacity-75' : 'bg-orange-500/[0.02] border-l-2 border-[#f97316]'
                    }`}
                  >
                    {/* Icon / Avatar based on category */}
                    <div className="mt-0.5 flex-shrink-0">
                      {notif.category === 'Alert' ? (
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : notif.category === 'Task' ? (
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <Settings className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-white leading-snug">{notif.title}</h4>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          notif.priority === 'High' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                          notif.priority === 'Medium' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                          'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                        }`}>
                          {notif.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed font-medium">{notif.message}</p>
                      
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[9px] text-gray-500 font-mono font-bold">{getHumanTime(notif.timestamp)}</span>
                        <div className="flex gap-2">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-0.5 bg-emerald-500/5 hover:bg-emerald-500/15 p-1 px-2 rounded-md transition cursor-pointer"
                              title="Mark Read"
                            >
                              <Check className="w-3 h-3" />
                              <span>Read</span>
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-gray-500 hover:text-red-400 transition p-1 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#0d1017] border-t border-[#1f2635] text-center text-[9px] text-gray-500 font-extrabold uppercase tracking-widest flex justify-between px-4">
              <span>{BRAND_CONFIG.VERSION_NAME}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Socket Active
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
