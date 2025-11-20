import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Profile = 'farmer' | 'technician' | 'loanMatching' | 'riskScoring';

interface KaAniSubHeaderProps {
  activeProfile: Profile;
  onProfileChange: (profile: Profile) => void;
  onDialectChange?: (dialect: string) => void;
}

export function KaAniSubHeader({
  activeProfile,
  onProfileChange,
  onDialectChange,
}: KaAniSubHeaderProps) {
  const [selectedDialect, setSelectedDialect] = useState("tagalog");

  const handleProfileChange = (profile: Profile) => {
    onProfileChange(profile);
  };

  const handleDialectChange = (dialect: string) => {
    setSelectedDialect(dialect);
    onDialectChange?.(dialect);
  };

  return (
    <div className="bg-white px-6 py-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Profile Tabs */}
          <Button
            variant={activeProfile === "farmer" ? "default" : "ghost"}
            className={
              activeProfile === "farmer"
                ? "bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleProfileChange("farmer")}
          >
            Farmer
          </Button>

          <Button
            variant={activeProfile === "technician" ? "default" : "ghost"}
            className={
              activeProfile === "technician"
                ? "bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleProfileChange("technician")}
          >
            Technician
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300" />

          {/* Context Options */}
          <Button
            variant="ghost"
            className={
              activeProfile === "loanMatching"
                ? "bg-green-100 text-green-800 hover:bg-green-200 font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleProfileChange("loanMatching")}
          >
            Loan Matching
          </Button>

          <Button
            variant="ghost"
            className={
              activeProfile === "riskScoring"
                ? "bg-green-100 text-green-800 hover:bg-green-200 font-medium rounded-lg px-6"
                : "text-gray-700 hover:bg-gray-100 font-medium rounded-lg px-6"
            }
            onClick={() => handleProfileChange("riskScoring")}
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
