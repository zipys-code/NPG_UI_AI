import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import ProcessManagement from "@/components/ProcessManagement";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <ProcessManagement />
      <AppFooter />
    </div>
  );
};

export default Index;
