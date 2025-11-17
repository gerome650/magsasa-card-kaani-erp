import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export function KaAniHeader() {
  return (
    <header className="bg-[#2D5F2E] text-white px-6 py-4 flex items-center justify-between">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold">KaAni</h1>
      </div>

      {/* Sample Formats Button */}
      <Button 
        variant="default" 
        className="bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        Sample Formats
      </Button>
    </header>
  );
}
