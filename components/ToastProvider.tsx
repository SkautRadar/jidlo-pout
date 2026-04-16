import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000); // Auto remove after 4 seconds
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto
              min-w-[300px] max-w-md
              p-4 rounded-xl shadow-2xl border-l-4
              transform transition-all duration-300 animate-slide-in
              flex items-center justify-between gap-3
              ${toast.type === 'success' ? 'bg-white border-emerald-500 text-slate-800' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-500 text-slate-800' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-500 text-slate-800' : ''}
            `}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {toast.type === 'success' && '✅'}
                                {toast.type === 'error' && '⚠️'}
                                {toast.type === 'info' && 'ℹ️'}
                            </span>
                            <div>
                                <h4 className={`font-black text-sm uppercase ${toast.type === 'success' ? 'text-emerald-600' :
                                        toast.type === 'error' ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                    {toast.type === 'success' ? 'Úspěch' : toast.type === 'error' ? 'Chyba' : 'Info'}
                                </h4>
                                <p className="text-sm font-bold text-slate-600 leading-tight">{toast.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 font-bold p-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
