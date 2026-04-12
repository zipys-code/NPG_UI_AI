import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
                </div>

                <div className="p-4 bg-slate-50 flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 size={18} /> מחיקה</>}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-all"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        </div>
    );
};