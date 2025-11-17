interface HighlightTextProps {
  text: string;
  highlight?: string;
  className?: string;
}

export function HighlightText({ text, highlight, className = "" }: HighlightTextProps) {
  if (!highlight || highlight.trim() === "") {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  // Create case-insensitive regex
  const regex = new RegExp(`(${escapeRegex(highlight)})`, "gi");
  
  // Split text by matches
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the highlight (case-insensitive)
        const isHighlight = part.toLowerCase() === highlight.toLowerCase();
        
        return isHighlight ? (
          <mark
            key={index}
            className="bg-yellow-200 text-yellow-900 font-semibold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}
