import AppHeader from "@/components/App/AppHeader";
import AppFooter from "@/components/App/AppFooter";
import ProcessManagement from "@/components/Process/ProcessManagement";

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
