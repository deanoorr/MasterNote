import { Box } from '@mantine/core';
import './markdown-styles.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Convert markdown headings to styled HTML
  const processMarkdown = (text: string) => {
    // Replace headings with properly styled headings
    let processedText = text
      // Replace numbered list items (e.g., "1. **Item**:") with proper formatting
      .replace(/^(\d+)\.\s+\*\*([^*:]+)\*\*:/gm, '<div class="numbered-item"><span class="number">$1.</span> <strong class="item-title">$2:</strong></div>')
      // Replace numbered list items (e.g., "1. **Item**") with proper formatting
      .replace(/^(\d+)\.\s+\*\*([^*:]+)\*\*/gm, '<div class="numbered-item"><span class="number">$1.</span> <strong class="item-title">$2</strong></div>')
      // Replace regular numbered list items
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="numbered-item"><span class="number">$1.</span> <span class="item-content">$2</span></div>')
      // Replace ### headings (h3)
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // Replace ## headings (h2)
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      // Replace # headings (h1)
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Replace **text** with <strong> (but not already processed ones)
      .replace(/\*\*([^<>*]+)\*\*/g, '<strong>$1</strong>')
      // Replace *text* with <em>
      .replace(/\*([^<>*]+)\*/g, '<em>$1</em>')
      // Replace bullet points
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Put bullet points in ul tags
      .replace(/(<li>.*<\/li>(\n|$))+/g, (match) => `<ul>${match}</ul>`)
      // Convert line breaks to <br> tags for proper spacing
      .replace(/\n\n/g, '<br><br>')
      // Preserve line breaks that aren't already covered by other replacements
      .replace(/\n(?!<)/g, '<br>');
    
    return processedText;
  };

  return (
    <Box 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: processMarkdown(content) }}
    />
  );
} 