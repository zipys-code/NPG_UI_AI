import React, { useState, useEffect } from 'react';
import { Check, Clock, X, AlertTriangle, Activity, List } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { apiRequest } from "@/services/api";
import { ProcessStatesModal } from './ProcessStatesModal';

// הוספנו לכל צבע גם הסבר בעברית
const getStepStyle = (colorCode: string) => {
    switch (colorCode?.toUpperCase()) {
        case 'GREEN': return { bg: 'bg-green-500', text: 'text-green-700', line: 'bg-green-500', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]', icon: <Check size={16} className="text-white" strokeWidth={3} />, tooltip: 'הושלם בהצלחה' };
        case 'RED': return { bg: 'bg-red-500', text: 'text-red-700', line: 'bg-slate-200', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]', icon: <X size={16} className="text-white" strokeWidth={3} />, tooltip: 'נכשל / שגיאה' };
        case 'YELLOW': return { bg: 'bg-yellow-500', text: 'text-yellow-700', line: 'bg-slate-200', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]', icon: <AlertTriangle size={16} className="text-white" strokeWidth={2.5} />, tooltip: 'מושהה / בהמתנה' };
        case 'BLUE': return { bg: 'bg-blue-500', text: 'text-blue-700', line: 'bg-slate-200', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]', icon: <Clock size={16} className="text-white" strokeWidth={2.5} />, tooltip: 'בתהליך (רץ עכשיו)' };
        default: return { bg: 'bg-white', text: 'text-slate-400', line: 'bg-slate-200', glow: 'shadow-sm', icon: <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />, tooltip: 'טרם התחיל / עתידי' };
    }
};

export const ProcessTimeline = ({ processId }: { processId: string }) => {
    const { token, currentNetworkId } = useApp();
    const [chartSteps, setChartSteps] = useState<any[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [isStatesModalOpen, setIsStatesModalOpen] = useState(false);

    useEffect(() => {
        const fetchChart = async () => {
            if (!processId) return;
            setLoadingChart(true);
            try {
                const res = await apiRequest('/GetProcessChart', {
                    getIn: { processId: processId, selfNetworkID: currentNetworkId, token }
                });
                const rawSteps = res?.getOut?.NPG_CHART?.STEPS?.STEP;
                if (rawSteps) setChartSteps(Array.isArray(rawSteps) ? rawSteps : [rawSteps]);
            } catch (err) {
                console.error("Error fetching process chart:", err);
            } finally {
                setLoadingChart(false);
            }
        };
        fetchChart();
    }, [processId, currentNetworkId, token]);

    return (
        <div className="mt-5 bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm w-full" dir="rtl">
            <div className="flex justify-start items-center gap-6 mb-6 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" />
                    <h4 className="text-[13px] font-extrabold text-slate-700 m-0">מעקב שלבי תהליך</h4>
                </div>

                <button
                    onClick={() => setIsStatesModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors active:scale-95"
                >
                    <List size={14} />
                    <span>הצגת שלבי תהליך</span>
                </button>
            </div>

            {loadingChart ? (
                <div className="flex justify-center items-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            ) : chartSteps.length === 0 ? (
                <div className="text-center text-slate-400 py-4 text-xs font-medium">לא נמצאו שלבים לתהליך זה</div>
            ) : (
                <div className="flex items-start justify-start w-full relative px-2">
                    {chartSteps.map((step, index) => {
                        const style = getStepStyle(step.STEP_COLOR);
                        const isLast = index === chartSteps.length - 1;

                        return (
                            <div key={index} className="flex flex-col items-center relative group w-[140px] shrink-0">
                                {!isLast && <div className={`absolute top-[14px] right-[50%] w-full h-[4px] z-0 transition-colors duration-300 rounded-full ${style.line}`}></div>}

                                {/* הוספנו את המאפיין title להצגת ההסבר בריחוף */}
                                <div
                                    title={style.tooltip}
                                    className={`cursor-help relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${style.bg} ${style.glow} border-2 border-white ring-4 ring-slate-50/80 transition-transform duration-300 group-hover:scale-110`}
                                >
                                    {style.icon}
                                </div>

                                <div className="flex flex-col items-center text-center mt-3 px-1 w-full">
                                    <span className={`text-[12px] font-extrabold ${style.text} leading-tight`}>{step.STEP_NAME || '-'}</span>
                                    {step.STEP_DATE && (
                                        <span className="text-[10.5px] text-slate-500 mt-1 font-medium tracking-tight bg-white/50 px-1.5 rounded" dir="ltr">{step.STEP_DATE}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <ProcessStatesModal
                isOpen={isStatesModalOpen}
                onClose={() => setIsStatesModalOpen(false)}
                processId={processId}
            />
        </div>

    );
};