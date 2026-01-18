import { useAuth } from "@/contexts/AuthContext";
import FarmerDashboard from "@/components/FarmerDashboard";
import FieldOfficerDashboard from "@/components/FieldOfficerDashboard";
import ManagerDashboard from "@/components/ManagerDashboard";
import { normalizeRole } from "@/const";

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

  // Use normalized role for farmer check (defensive)
  const normalizedRole = normalizeRole(user);
  if (normalizedRole === "farmer") {
    return <FarmerDashboard />;
  }

  // For staff roles, use original role for specific dashboard routing
  switch (user.role) {
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
