import { ReactNode } from "react";

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  // Parse content with better structure
  const parseContent = (text: string) => {
    const lines = text.split("\n");
    const elements: ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listType: "ul" | "ol" = "ul";

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType;
        elements.push(
          <ListTag key={`list-${elements.length}`} className="space-y-2 my-6 ml-4">
            {listItems.map((item, i) => (
              <li key={i} className="text-neutral-300 text-lg font-medium flex items-start gap-3">
                {listType === "ul" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-neon mt-2.5 flex-shrink-0" />
                )}
                <span dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
        inList = false;
      }
    };

    // Escape raw HTML to prevent XSS before applying markdown-style replacements
    const escapeHtml = (raw: string): string => {
      return raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    };

    const sanitizeUrl = (url: string): string => {
      const trimmed = url.trim().toLowerCase();
      if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
        return '#';
      }
      return url;
    };

    const parseInline = (text: string): string => {
      const safe = escapeHtml(text);
      return safe
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-neutral-400 italic">$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, (_, text, url) => {
          const sUrl = sanitizeUrl(url);
          return `<a href="${sUrl}" class="text-neon hover:underline underline-offset-4" ${sUrl === '#' ? '' : 'target="_blank" rel="noopener noreferrer"'}>${text}</a>`;
        })
        .replace(/`([^`]+)`/g, '<code class="bg-white/5 px-2 py-0.5 rounded text-sm font-mono text-neon">$1</code>');
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        flushList();
        continue;
      }

      // H2 headings
      if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h2
            key={elements.length}
            className="text-3xl font-black uppercase tracking-tighter text-white mt-12 mb-6 first:mt-0"
          >
            {line.replace("## ", "")}
          </h2>
        );
        continue;
      }

      // H3 headings
      if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={elements.length}
            className="text-xl font-black uppercase tracking-tight text-white mt-8 mb-4"
          >
            {line.replace("### ", "")}
          </h3>
        );
        continue;
      }

      // Ordered list start
      if (/^\d+\.\s/.test(line)) {
        if (!inList || listType !== "ol") {
          flushList();
          inList = true;
          listType = "ol";
        }
        listItems.push(line.replace(/^\d+\.\s/, ""));
        continue;
      }

      // Unordered list start
      if (line.startsWith("- ") || line.startsWith("• ")) {
        if (!inList || listType !== "ul") {
          flushList();
          inList = true;
          listType = "ul";
        }
        listItems.push(line.replace(/^[-•]\s/, ""));
        continue;
      }

      // Checkmark list item
      if (line.startsWith("✅ ")) {
        flushList();
        elements.push(
          <div
            key={elements.length}
            className="flex items-start gap-3 my-4 p-4 bg-neon/5 border border-neon/10 rounded-2xl"
          >
            <span className="text-2xl">✅</span>
            <span
              className="text-neutral-300 text-lg font-medium"
              dangerouslySetInnerHTML={{ __html: parseInline(line.replace("✅ ", "")) }}
            />
          </div>
        );
        continue;
      }

      // Horizontal rule
      if (line.startsWith("---")) {
        flushList();
        elements.push(<hr key={elements.length} className="border-white/10 my-12" />);
        continue;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        flushList();
        elements.push(
          <blockquote
            key={elements.length}
            className="border-l-4 border-neon pl-6 py-4 my-8 bg-white/5 rounded-r-2xl"
          >
            <p
              className="text-neutral-300 text-lg font-medium italic"
              dangerouslySetInnerHTML={{ __html: parseInline(line.replace("> ", "")) }}
            />
          </blockquote>
        );
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p
          key={elements.length}
          className="text-neutral-300 text-lg font-medium leading-relaxed my-6"
          dangerouslySetInnerHTML={{ __html: parseInline(line) }}
        />
      );
    }

    flushList();
    return elements;
  };

  return (
    <div className="prose prose-invert max-w-none">
      {parseContent(content)}
    </div>
  );
}
