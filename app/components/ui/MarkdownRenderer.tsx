import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // Simple parser for basic markdown
    // 1. Headers (##, ###)
    // 2. Bold (**)
    // 3. Lists (-)
    // 4. Line breaks

    const parseMarkdown = (text: string) => {
        if (!text) return null;

        // Split by lines to handle block elements
        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];

        lines.forEach((line, index) => {
            let key = `line-${index}`;

            // Headers
            if (line.startsWith('### ')) {
                elements.push(<h3 key={key} className="text-md font-bold text-gray-800 dark:text-gray-100 mt-3 mb-1">{line.replace('### ', '')}</h3>);
                return;
            }
            if (line.startsWith('## ')) {
                elements.push(<h2 key={key} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{line.replace('## ', '')}</h2>);
                return;
            }
            if (line.startsWith('# ')) {
                elements.push(<h1 key={key} className="text-xl font-extrabold text-gray-900 dark:text-white mt-5 mb-3">{line.replace('# ', '')}</h1>);
                return;
            }

            // List items
            if (line.trim().startsWith('- ')) {
                const content = parseInline(line.trim().substring(2));
                elements.push(
                    <li key={key} className="ml-4 list-disc text-gray-700 dark:text-gray-300">
                        {content}
                    </li>
                );
                return;
            }

            // Empty lines
            if (line.trim() === '') {
                elements.push(<div key={key} className="h-2" />);
                return;
            }

            // Paragraphs
            elements.push(
                <p key={key} className="mb-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                    {parseInline(line)}
                </p>
            );
        });

        return elements;
    };

    const parseInline = (text: string): React.ReactNode[] => {
        // Handle bold (**text**) and italic (*text*)
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return <em key={i} className="italic text-gray-800 dark:text-gray-200">{part.slice(1, -1)}</em>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return <div className="space-y-1">{parseMarkdown(content)}</div>;
};
