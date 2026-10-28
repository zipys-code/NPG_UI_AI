import React, { useState, useRef, useEffect } from 'react';
import { X, Waypoints, Info, CheckCircle2, ZoomIn, ZoomOut, Maximize, ExternalLink } from 'lucide-react';

// אנחנו משתמשים ב-SVG כדי שיהיה חד וחלק
const PROCESSES = [
    { id: 'port-in', title: 'Port In', file: '/flows/PortInProcess-cropped.svg' },
    { id: 'port-out', title: 'Port Out', file: '/flows/PortOutProcess-cropped.svg' },
    { id: 'port-over', title: 'Port Over', file: '/flows/PortOver-cropped.svg' },
    { id: 'return-in', title: 'Return In', file: '/flows/ReturnInProcess-cropped.svg' },
    { id: 'return-out', title: 'Return Out', file: '/flows/ReturnOutProcess-cropped.svg' },
    { id: 'return-over', title: 'Return Over', file: '/flows/ReturnOver-cropped.svg' },
    { id: 'number-inquiry', title: 'Number Inquiry', file: '/flows/NumberInquiry-cropped.svg' }
];

// רמות הזום באחוזים (100% = התאמה למסך)
const ZOOM_STEPS = [100, 200, 400, 800, 1500];

export const ProcessFlowDrawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [selectedProcess, setSelectedProcess] = useState(PROCESSES[0]);
    const [zoomIndex, setZoomIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // --- הפתרון לקסם הלבן! ---
    // כל פעם שמשנים תהליך או עושים זום - אנחנו מכריחים את הפס גלילה לחזור להתחלה (שמאל ולמעלה)
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0, top: 0, behavior: 'instant' });
        }
    }, [zoomIndex, selectedProcess]);

    const handleProcessSelect = (proc: any) => {
        setSelectedProcess(proc);
        setZoomIndex(0);
    };

    const zoomIn = () => setZoomIndex(prev => Math.min(prev + 1, ZOOM_STEPS.length - 1));
    const zoomOut = () => setZoomIndex(prev => Math.max(prev - 1, 0));
    const fitToScreen = () => setZoomIndex(0);

    // פתיחה בכרטיסייה חדשה
    const openInNewTab = () => {
        window.open(selectedProcess.file, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex" dir="rtl">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-6xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between p-5 bg-[#2563eb] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <Waypoints size={24} />
                        <h2 className="text-xl font-bold">מילון תהליכים ותרשימי זרימה</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* תפריט הצד */}
                    <div className="w-56 bg-slate-50 border-l border-slate-200 overflow-y-auto shrink-0 p-3">
                        <div className="text-sm font-semibold text-slate-500 mb-3 px-2">בחר תהליך:</div>
                        <ul className="space-y-1.5">
                            {PROCESSES.map((proc) => {
                                const isSelected = selectedProcess.id === proc.id;
                                return (
                                    <li key={proc.id}>
                                        <button
                                            onClick={() => handleProcessSelect(proc)}
                                            className={`w-full text-right px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${isSelected
                                                ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200'
                                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'
                                                }`}
                                        >
                                            <span className="truncate">{proc.title}</span>
                                            {isSelected && <CheckCircle2 size={16} className="text-blue-600 shrink-0 mr-1" />}
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* אזור התצוגה המרכזי */}
                    <div className="flex-1 overflow-hidden bg-white p-4 sm:p-5 flex flex-col relative">

                        {/* ההדר עם הכלים */}
                        <div className="mb-4 flex items-center justify-between bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 shrink-0">
                            <div className="flex gap-3 items-center">
                                <Info size={24} className="shrink-0" />
                                <div>
                                    <h3 className="font-bold text-base">{selectedProcess.title}</h3>
                                    <p className="text-sm opacity-90 hidden sm:block">
                                        השתמש בסרגל הזום כדי להתמקד, או פתח בחלון חדש לתצוגה מלאה.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* סרגל הזום */}
                                <div className="flex items-center bg-white rounded-lg border border-blue-200 shadow-sm" dir="ltr">
                                    <button onClick={zoomOut} disabled={zoomIndex === 0} className="p-2 text-blue-700 hover:bg-blue-50 disabled:opacity-30 transition-colors">
                                        <ZoomOut size={20} />
                                    </button>
                                    <div className="px-1 text-sm font-bold text-blue-900 min-w-[65px] text-center select-none border-x border-blue-100">
                                        {zoomIndex === 0 ? 'Fit' : `${ZOOM_STEPS[zoomIndex]}%`}
                                    </div>
                                    <button onClick={zoomIn} disabled={zoomIndex === ZOOM_STEPS.length - 1} className="p-2 text-blue-700 hover:bg-blue-50 disabled:opacity-30 transition-colors">
                                        <ZoomIn size={20} />
                                    </button>
                                    <div className="w-[1px] h-6 bg-blue-200 mx-1"></div>
                                    <button onClick={fitToScreen} disabled={zoomIndex === 0} className="p-2 text-blue-700 hover:bg-blue-50 disabled:opacity-30 transition-colors" title="התאם למסך">
                                        <Maximize size={18} />
                                    </button>
                                </div>

                                {/* כפתור פתיחה בחלון חדש */}
                                <button
                                    onClick={openInNewTab}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                                >
                                    <span>חלון חדש</span>
                                    <ExternalLink size={16} />
                                </button>
                            </div>
                        </div>

                        {/* אזור הגלילה (מוגדר כ-LTR במפורש) */}
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-auto bg-slate-50 border-2 border-slate-200 rounded-xl custom-scrollbar"
                            dir="ltr"
                        >
                            {/* העטיפה הפנימית */}
                            <div
                                style={{
                                    width: zoomIndex === 0 ? '100%' : `${ZOOM_STEPS[zoomIndex]}%`,
                                    minHeight: '100%',
                                    transition: 'width 0.3s ease-out'
                                }}
                                className={zoomIndex === 0 ? 'flex items-center justify-center p-4 h-full' : 'p-8'}
                            >
                                <img
                                    src={selectedProcess.file}
                                    alt={`תרשים זרימה של ${selectedProcess.title}`}
                                    onClick={zoomIndex === 0 ? zoomIn : undefined}
                                    className={`origin-top-left ${zoomIndex === 0
                                        ? 'max-w-full max-h-full object-contain cursor-zoom-in'
                                        : 'w-full h-auto drop-shadow-md block'
                                        }`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />

                                <div className="hidden text-slate-400 text-center mt-20 w-full" dir="rtl">
                                    <Waypoints size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>התמונה טרם נוספה או שיש בעיה בטעינתה.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};