import { useAuth } from "@/contexts/AuthContext";
import FarmerDashboard from "@/components/FarmerDashboard";
import FieldOfficerDashboard from "@/components/FieldOfficerDashboard";
import ManagerDashboard from "@/components/ManagerDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  // Render different dashboard based on user role
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  switch (user.role) {
    case 'farmer':
      return <FarmerDashboard />;
    case 'field_officer':
      return <FieldOfficerDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Unknown user role</p>
        </div>
      );
  }
}
