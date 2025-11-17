import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onPromptClick }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {prompts.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          className="border-2 border-green-600 text-green-800 hover:bg-green-50 hover:border-green-700 rounded-full px-6 py-2 font-medium"
          onClick={() => onPromptClick(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
