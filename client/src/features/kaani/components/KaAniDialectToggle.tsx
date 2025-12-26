import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KaAniDialect } from "../types";

interface KaAniDialectToggleProps {
  dialect: KaAniDialect;
  onDialectChange: (dialect: KaAniDialect) => void;
}

export function KaAniDialectToggle({ dialect, onDialectChange }: KaAniDialectToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Dialect:</span>
      <Select value={dialect} onValueChange={(value) => onDialectChange(value as KaAniDialect)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tagalog">Tagalog</SelectItem>
          <SelectItem value="cebuano">Cebuano</SelectItem>
          <SelectItem value="english">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

