import React from 'react';
import { Info, ArrowUpDown, Plus, MessageSquare } from 'lucide-react';
import styles from './ProcessDetails.module.css';

interface ProcessDetailsProps {
    proc: any;
    onShowMessages?: (requestId: string) => void;
}

export const ProcessDetails: React.FC<ProcessDetailsProps> = ({ proc, onShowMessages }) => {
    return (
        <div className={styles.detailsContainer} dir="rtl">
            <div className={styles.grid}>
                {/* כרטיס זיהוי ולקוח */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Info size={14} />
                        <h4>זיהוי ולקוח</h4>
                    </div>
                    <div className={styles.dataRow}>
                        <span className={styles.label}>מזהה לקוח:</span>
                        <span className={styles.value}>{proc.customerId || '---'}</span>
                        <span className={styles.label}>פרופיל:</span>
                        <span className={styles.value}>{proc.customerProfile || '---'}</span>
                        <span className={styles.label}>מספר הזמנה:</span>
                        <span className={styles.value}>{proc.orderId || '---'}</span>
                        <span className={styles.label}>מספר קבוצה:</span>
                        <span className={styles.value}>{proc.groupId || '---'}</span>
                    </div>
                </div>

                {/* כרטיס הפצה ושגיאות */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <ArrowUpDown size={14} />
                        <h4>נתוני הפצה ושגיאות</h4>
                    </div>
                    <div className={styles.dataRow}>
                        <span className={styles.label}>הפצות חסרות:</span>
                        <span className={styles.value}>{proc.missDist || 0}</span>
                        <span className={styles.label}>הפצות שנכשלו:</span>
                        <span className={`${styles.value} ${proc.failDist ? styles.errorText : ''}`}>{proc.failDist || 0}</span>
                        <span className={styles.label}>קוד שגיאה:</span>
                        <span className={`${styles.value} ${proc.errorCode ? styles.errorText : ''}`}>{proc.errorCode || 'אין'}</span>
                        <span className={styles.label}>סיבת מעבר:</span>
                        <span className={styles.value}>{proc.reasonDesc || '---'}</span>
                    </div>
                </div>

                {/* כרטיס נתוני מוביל */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Plus size={14} />
                        <h4>נתוני מוביל</h4>
                    </div>
                    <div className={styles.dataRow}>
                        <span className={styles.label}>מוביל קולט:</span>
                        <span className={styles.value}>{proc.leadRec || '---'}</span>
                        <span className={styles.label}>מוביל ננטש:</span>
                        <span className={styles.value}>{proc.leadAbd || '---'}</span>
                        <span className={styles.label}>מספר מוחלף:</span>
                        <span className={styles.value}>{proc.replacedNum || '---'}</span>
                    </div>
                </div>


                <button
                    onClick={() => onShowMessages?.(proc.requestId)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold text-[11px] transition-all shadow-sm active:scale-95"
                >
                    <MessageSquare size={14} />
                    <span>צפייה במסרים</span>
                </button>
            </div>
        </div>
    );
};
