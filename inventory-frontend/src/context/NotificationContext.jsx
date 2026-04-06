import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, MessageSquare } from 'lucide-react';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [promptDialog, setPromptDialog] = useState(null);

    const showToast = useCallback((message, type = 'success', duration = 4000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
    }, []);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                ...options,
                resolve: (value) => {
                    setConfirmDialog(null);
                    resolve(value);
                }
            });
        });
    }, []);

    const prompt = useCallback((options) => {
        return new Promise((resolve) => {
            setPromptDialog({
                ...options,
                resolve: (value) => {
                    setPromptDialog(null);
                    resolve(value);
                }
            });
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, confirm, prompt }}>
            {children}

            {/* Global Toast Container */}
            <div className="fixed bottom-8 right-8 z-[2000] flex flex-col gap-3 pointer-events-none">
                {notifications.map(n => (
                    <Toast key={n.id} {...n} onClose={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} />
                ))}
            </div>

            {/* Global Confirmation Modal */}
            {confirmDialog && (
                <ConfirmModal
                    {...confirmDialog}
                    onClose={() => confirmDialog.resolve(false)}
                    onConfirm={() => confirmDialog.resolve(true)}
                />
            )}

            {/* Global Prompt Modal */}
            {promptDialog && (
                <PromptModal
                    {...promptDialog}
                    onClose={() => promptDialog.resolve(null)}
                    onConfirm={(val) => promptDialog.resolve(val)}
                />
            )}
        </NotificationContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const styles = {
        success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', progress: 'bg-emerald-500' },
        error: { icon: XCircle, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', progress: 'bg-rose-500' },
        warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', progress: 'bg-amber-500' },
        info: { icon: Info, bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', progress: 'bg-indigo-500' },
    }[type] || styles.success;

    const Icon = styles.icon;

    return (
        <div className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border ${styles.bg} ${styles.border} ${styles.text} animate-in slide-in-from-right-full duration-300 relative overflow-hidden group min-w-[320px]`}>
            <div className="p-2 bg-white rounded-xl shadow-sm">
                <Icon size={20} className={styles.text} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest flex-1">{message}</p>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
                <X size={16} />
            </button>
            <div className={`absolute bottom-0 left-0 h-1 ${styles.progress} animate-progress-shrink`} />
        </div>
    );
};

const XCircle = ({ size, className }) => <X size={size} className={className} />;

const ConfirmModal = ({ title, message, onConfirm, onClose, confirmLabel, cancelLabel, type = 'danger' }) => {
    const typeStyles = {
        danger: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' },
        warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' },
        info: { icon: Info, color: 'text-indigo-600', bg: 'bg-indigo-50', btn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' },
    }[type];

    const Icon = typeStyles.icon;

    return (
        <div className="fixed inset-0 z-[2100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="px-10 py-10 text-center space-y-6">
                    <div className={`w-20 h-20 ${typeStyles.bg} ${typeStyles.color} rounded-3xl flex items-center justify-center mx-auto shadow-inner`}>
                        <Icon size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title || 'Confirm Action'}</h3>
                        <p className="text-sm font-medium text-slate-500 italic px-4">{message}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                        >
                            {cancelLabel || 'Abort'}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-6 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${typeStyles.btn}`}
                        >
                            {confirmLabel || 'Commit'}
                        </button>
                    </div>
                </div>
                <div className="h-2 bg-slate-50 border-t border-slate-100" />
            </div>
        </div>
    );
};

const PromptModal = ({ title, message, onConfirm, onClose, placeholder, confirmLabel, cancelLabel, defaultValue = '' }) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    return (
        <div className="fixed inset-0 z-[2100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="px-10 py-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                        <MessageSquare size={40} />
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title || 'Information Required'}</h3>
                            <p className="text-sm font-medium text-slate-500 italic px-4">{message}</p>
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder || 'Enter value...'}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase tracking-widest text-center"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onConfirm(value);
                                if (e.key === 'Escape') onClose();
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                        >
                            {cancelLabel || 'Cancel'}
                        </button>
                        <button
                            onClick={() => onConfirm(value)}
                            className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-600 transition-all active:scale-95 shadow-indigo-100"
                        >
                            {confirmLabel || 'Submit'}
                        </button>
                    </div>
                </div>
                <div className="h-2 bg-slate-50 border-t border-slate-100" />
            </div>
        </div>
    );
};
