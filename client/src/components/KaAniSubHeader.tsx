import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = "farmer" | "technician";
type Context = "loan_matching" | "risk_scoring" | null;

interface KaAniSubHeaderProps {
  onRoleChange?: (role: Role) => void;
  onContextChange?: (context: Context) => void;
  onDialectChange?: (dialect: string) => void;
}

export function KaAniSubHeader({
  onRoleChange,
  onContextChange,
  onDialectChange,
}: KaAniSubHeaderProps) {
  const [selectedRole, setSelectedRole] = useState<Role>("farmer");
  const [selectedContext, setSelectedContext] = useState<Context>(null);
  const [selectedDialect, setSelectedDialect] = useState("tagalog");

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    onRoleChange?.(role);
  };

  const handleContextToggle = (context: Context) => {
    const newContext = selectedContext === context ? null : context;
    setSelectedContext(newContext);
    onContextChange?.(newContext);
  };

  const handleDialectChange = (dialect: string) => {
    setSelectedDialect(dialect);
    onDialectChange?.(dialect);
  };

  return (
    <div className="bg-white px-6 py-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Role Tabs */}
          <Button
            variant={selectedRole === "farmer" ? "default" : "ghost"}
            className={
              selectedRole === "farmer"
                ? "bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleRoleChange("farmer")}
          >
            Farmer
          </Button>

          <Button
            variant={selectedRole === "technician" ? "default" : "ghost"}
            className={
              selectedRole === "technician"
                ? "bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleRoleChange("technician")}
          >
            Technician
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300" />

          {/* Context Options */}
          <Button
            variant="ghost"
            className={
              selectedContext === "loan_matching"
                ? "bg-green-100 text-green-800 hover:bg-green-200 font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleContextToggle("loan_matching")}
          >
            Loan Matching
          </Button>

          <Button
            variant="ghost"
            className={
              selectedContext === "risk_scoring"
                ? "bg-green-100 text-green-800 hover:bg-green-200 font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleContextToggle("risk_scoring")}
          >
            Risk Scoring
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300" />

          {/* Dialect Selector */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">Dialect:</span>
            <Select value={selectedDialect} onValueChange={handleDialectChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tagalog">Tagalog</SelectItem>
                <SelectItem value="cebuano">Cebuano</SelectItem>
                <SelectItem value="ilonggo">Ilonggo</SelectItem>
                <SelectItem value="ilocano">Ilocano</SelectItem>
                <SelectItem value="pangalatok">Pangalatok</SelectItem>
                <SelectItem value="kapampangan">Kapampangan</SelectItem>
                <SelectItem value="bicolano">Bicolano</SelectItem>
                <SelectItem value="waray">Waray</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Voice Input Toggle (visual only for now) */}
          <div className="ml-auto">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
