import { Button } from "@/components/ui/button";
import { StarterPrompt } from "../types";

interface KaAniPromptChipsProps {
  prompts: StarterPrompt[];
  onPromptClick: (message: string) => void;
}

export function KaAniPromptChips({ prompts, onPromptClick }: KaAniPromptChipsProps) {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center px-4 py-4">
      {prompts.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="border-2 border-green-600 text-green-800 hover:bg-green-50 hover:border-green-700 rounded-full px-4 py-2 text-sm font-medium"
          onClick={() => onPromptClick(prompt.message)}
        >
          {prompt.label}
        </Button>
      ))}
    </div>
  );
}

