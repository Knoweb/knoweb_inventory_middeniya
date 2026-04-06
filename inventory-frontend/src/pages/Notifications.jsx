import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, Trash2, RefreshCw, BellOff, Check, Filter } from 'lucide-react';

const Notifications = () => {
  const { confirm } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [activeTypeTab, setActiveTypeTab] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const orgId = user.orgId;

      if (!orgId) {
        setError('Organization ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await notificationService.getAll();
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);

      const mappedNotifications = list
        .filter(notif => notif.orgId && String(notif.orgId) === String(orgId))
        .map(notif => ({
          id: notif.id,
          orgId: notif.orgId,
          type: notif.type || 'INFO',
          title: generateTitle(notif.type, notif.message),
          message: notif.message || 'No message provided',
          read: notif.readStatus === true,
          createdAt: notif.createdAt,
          requestEntityId: notif.requestEntityId,
          details: notif.requestEntityId ? `Related Entity ID: ${notif.requestEntityId}` : null
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications. ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const generateTitle = (type, message) => {
    if (!type) return 'Notification';
    const typeUpper = type.toUpperCase();
    if (message && message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    switch (typeUpper) {
      case 'SUCCESS': return 'Success Notification';
      case 'WARNING': return 'Warning Alert';
      case 'ERROR': return 'Error Alert';
      case 'INFO': return 'Information';
      default: return `${type} Notification`;
    }
  };

  const [markingAllRead, setMarkingAllRead] = useState(false);

  const markAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (markingAllRead) return;
    const isConfirmed = await confirm({
      title: 'Commit All events',
      message: 'This will synchronize your read-state with all pending alerts. Proceed with global acknowledgement?',
      type: 'info',
      confirmLabel: 'Commit All',
      cancelLabel: 'Abort'
    });
    if (!isConfirmed) return;

    setMarkingAllRead(true);
    setError('');

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) {
        setMarkingAllRead(false);
        return;
      }
      await Promise.all(unreadNotifications.map(n => notificationService.markAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all as read. Please try again.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const deleteNotification = async (id) => {
    const isConfirmed = await confirm({
      title: 'Purge Notification',
      message: 'This will permanently detach the event from your registry stream. Confirm decommissioning?',
      type: 'danger',
      confirmLabel: 'Purge Record',
      cancelLabel: 'Cancel'
    });
    if (!isConfirmed) return;
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'WARNING': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'ERROR': return <AlertCircle size={18} className="text-rose-500" />;
      default: return <Info size={18} className="text-indigo-500" />;
    }
  };

  const getBadgeColors = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'WARNING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'ERROR': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeStatusTab === 'unread' && notif.read) return false;
    if (activeStatusTab === 'read' && !notif.read) return false;
    if (activeTypeTab !== 'all' && notif.type?.toUpperCase() !== activeTypeTab) return false;
    return true;
  });

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;
  const errorCount = notifications.filter(n => n.type?.toUpperCase() === 'ERROR').length;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-start border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notification Feed</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 italic">
            {unreadCount > 0 ? `Detected ${unreadCount} unread system alerts in your node` : 'Temporal stream synchronized — all events seen'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshNotifications}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:rotate-180 duration-500"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Synchronizing…' : 'Sync Stream'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAllRead || refreshing}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              {markingAllRead ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Commit All as Read
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-10">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Filter size={10} /> Read State</label>
          <div className="flex gap-1 bg-slate-100/60 p-1 rounded-xl shadow-inner border border-slate-100">
            {['all', 'unread', 'read'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStatusTab(tab)}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeStatusTab === tab
                  ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-400 hover:text-slate-500'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Bell size={10} /> Alert Class</label>
          <div className="flex gap-1 bg-slate-100/60 p-1 rounded-xl shadow-inner border border-slate-100">
            {['all', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTypeTab(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTypeTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-slate-400 hover:text-slate-500'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 text-slate-300">
            <RefreshCw size={40} className="animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">De-serializing Events…</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-24 text-center shadow-sm">
            <div className="inline-flex p-6 rounded-full bg-slate-50 text-slate-200 mb-6 border border-slate-50 shadow-inner">
              <BellOff size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Temporal Silence Detected</h3>
            <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs mx-auto italic">No system events match your current spectral filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`group bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-pointer flex gap-4 ${notif.read ? 'border-slate-100 opacity-60' : 'border-indigo-100 ring-4 ring-indigo-50/50'
                  }`}
              >
                <div className={`p-3 rounded-xl shadow-inner shrink-0 self-start ${getBadgeColors(notif.type)}`}>
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="text-sm font-black text-slate-800 tracking-tight truncate">{notif.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${getBadgeColors(notif.type)}`}>
                        {notif.type}
                      </span>
                      {!notif.read && <span className="text-[8px] font-black uppercase bg-indigo-600 text-white px-1.5 py-0.5 rounded-md animate-pulse">New</span>}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter shrink-0">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed italic pr-12">"{notif.message}"</p>
                  {notif.requestEntityId && <div className="text-[10px] font-bold text-slate-400 mt-2 bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100">LOGGED-ENTITY_REF: #{notif.requestEntityId}</div>}
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all shadow-sm border border-rose-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-3xl p-10 mt-16 shadow-2xl shadow-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-1 border-l-2 border-slate-800 pl-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Aggregate Log</span>
            <div className="text-3xl font-black text-white tracking-tighter">{totalCount}</div>
          </div>
          <div className="space-y-1 border-l-2 border-indigo-500 pl-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Pending Action</span>
            <div className="text-3xl font-black text-indigo-400 tracking-tighter">{unreadCount}</div>
          </div>
          <div className="space-y-1 border-l-2 border-emerald-500 pl-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Processed</span>
            <div className="text-3xl font-black text-emerald-400 tracking-tighter">{readCount}</div>
          </div>
          <div className="space-y-1 border-l-2 border-rose-500 pl-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Critical Errors</span>
            <div className="text-3xl font-black text-rose-400 tracking-tighter">{errorCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
