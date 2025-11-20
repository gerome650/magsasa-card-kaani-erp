import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownMessageProps = {
  content: string;
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // Prevent KaAni from accidentally rendering headings too huge, etc.
      components={{
        h1: ({ node, ...props }) => <p className="font-bold text-lg" {...props} />,
        h2: ({ node, ...props }) => <p className="font-bold" {...props} />,
        h3: ({ node, ...props }) => <p className="font-bold" {...props} />,
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
        li: ({ node, ...props }) => <li className="ml-2" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        code: ({ node, ...props }) => (
          <code className="bg-gray-300 px-1 py-0.5 rounded text-sm font-mono" {...props} />
        ),
        pre: ({ node, ...props }) => (
          <pre className="bg-gray-300 p-2 rounded overflow-x-auto mb-2" {...props} />
        ),
      }}
      className="whitespace-pre-wrap break-words"
    >
      {content}
    </ReactMarkdown>
  );
};

