import { Button } from "@/components/ui/button";
import { KaAniAudience } from "../types";

interface KaAniAudienceToggleProps {
  audience: KaAniAudience;
  onAudienceChange: (audience: KaAniAudience) => void;
}

export function KaAniAudienceToggle({ audience, onAudienceChange }: KaAniAudienceToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Audience:</span>
      <Button
        variant={audience === "loan_officer" ? "default" : "outline"}
        size="sm"
        onClick={() => onAudienceChange("loan_officer")}
        className={
          audience === "loan_officer"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "text-gray-700 hover:bg-gray-50"
        }
      >
        Loan Officer
      </Button>
      <Button
        variant={audience === "farmer" ? "default" : "outline"}
        size="sm"
        onClick={() => onAudienceChange("farmer")}
        className={
          audience === "farmer"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "text-gray-700 hover:bg-gray-50"
        }
      >
        Farmer
      </Button>
    </div>
  );
}

