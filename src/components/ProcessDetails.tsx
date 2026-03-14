import React from 'react';
import { Info, ArrowUpDown, Plus } from 'lucide-react';
import styles from './ProcessDetails.module.css';

interface ProcessDetailsProps {
    proc: any;
}

export const ProcessDetails: React.FC<ProcessDetailsProps> = ({ proc }) => {
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
                        <span className={styles.value}>{proc.custId}</span>
                        <span className={styles.label}>פרופיל:</span>
                        <span className={styles.value}>{proc.profile}</span>
                        <span className={styles.label}>מספר הזמנה:</span>
                        <span className={styles.value}>{proc.orderId}</span>
                        <span className={styles.label}>מספר קבוצה:</span>
                        <span className={styles.value}>{proc.groupId}</span>
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
                        <span className={styles.value}>{proc.missDist}</span>
                        <span className={styles.label}>הפצות שנכשלו:</span>
                        <span className={`${styles.value} ${styles.errorText}`}>{proc.failDist}</span>
                        <span className={styles.label}>קוד שגיאה:</span>
                        <span className={`${styles.value} ${styles.errorText}`}>{proc.errCode}</span>
                        <span className={styles.label}>סיבת מעבר:</span>
                        <span className={styles.value}>{proc.reason}</span>
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
                        <span className={styles.value}>{proc.leadRec}</span>
                        <span className={styles.label}>מוביל ננטש:</span>
                        <span className={styles.value}>{proc.leadAbd}</span>
                        <span className={styles.label}>מספר מוחלף:</span>
                        <span className={styles.value}>{proc.replacedNum}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};