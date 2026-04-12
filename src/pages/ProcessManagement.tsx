import ProcessManagementComponent from '@/components/ProcessManagement';

export default function ProcessManagementPage() {
    // כאן אנחנו רק קוראים לקומפוננטה האמיתית ומעבירים לה את ה-mode
    return <ProcessManagementComponent mode="MANAGE" />;
}