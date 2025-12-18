import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Edit3, Save, X, RotateCcw, FileText, Code, Check,
    Maximize2, Minimize2, Terminal, Download, Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { marked } from 'marked';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

const CanvasPanel = ({ content, type: initialType = 'document', title = 'Untitled', isStreaming = false, onClose, onUpdate, onSaveToNotes }) => {
    // Normalize type to ensure robustness (AI might output 'markdown' or 'text')
    const type = (initialType.toLowerCase() === 'markdown' || initialType.toLowerCase() === 'text') ? 'document' : initialType;

    const [isEditing, setIsEditing] = useState(false);
    const [localContent, setLocalContent] = useState(content);
    const [htmlContent, setHtmlContent] = useState(''); // For Quill
    const [showCopied, setShowCopied] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    useEffect(() => {
        setLocalContent(content);
    }, [content]);

    // Initialize HTML for Quill when starting edit
    useEffect(() => {
        if (isEditing && type === 'document') {
            const parsedHtml = marked.parse(localContent);
            setHtmlContent(parsedHtml);
        }
    }, [isEditing, localContent, type]);

    // Auto-save logic if editing
    const handleSave = () => {
        if (isEditing && type === 'document') {
            // Convert HTML back to Markdown
            const markdown = turndownService.turndown(htmlContent);
            setLocalContent(markdown);
            if (onUpdate) onUpdate(markdown);
        } else {
            if (onUpdate) onUpdate(localContent);
        }
        setIsEditing(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(localContent);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const handleExportPDF = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Please allow popups to download PDF');

        const style = `
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #1f1f1f; }
                h1 { font-size: 2.5em; border-bottom: 2px solid #eaeaea; padding-bottom: 0.5em; margin-bottom: 1em; }
                h2 { font-size: 1.8em; margin-top: 1.5em; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3em; }
                h3 { font-size: 1.4em; margin-top: 1.2em; }
                p { margin-bottom: 1em; }
                ul, ol { margin-bottom: 1em; padding-left: 2em; }
                li { margin-bottom: 0.5em; }
                pre { background: #f4f4f5; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
                code { font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.9em; background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; }
                pre code { background: transparent; padding: 0; }
                blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #666; margin: 1em 0; }
                img { max-width: 100%; height: auto; border-radius: 8px; }
                a { color: #2563eb; text-decoration: none; }
            </style>
        `;

        let bodyContent = '';

        if (type === 'code') {
            bodyContent = `<pre><code>${localContent.replace(/</g, '&lt;')}</code></pre>`;
        } else {
            // Parse Markdown to HTML
            try {
                // If using async marked:
                // bodyContent = await marked.parse(localContent); 
                // Synchronous check:
                bodyContent = marked.parse(localContent);
            } catch (e) {
                console.error("Markdown parse error", e);
                bodyContent = `<div style="white-space: pre-wrap">${localContent}</div>`;
            }
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${title}</title>
                    ${style}
                </head>
                <body>
                    <h1>${title}</h1>
                    ${type === 'document' ? '<div style="white-space: pre-wrap">' + marked.parse(localContent) + '</div>' : printContent}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        setExportOpen(false);
    };

    const renderPreview = () => {
        if (type === 'code') {
            // Auto-run for Web/HTML code
            if (isStreaming) {
                return (
                    <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 gap-3">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium tracking-wide">Generating Code...</span>
                    </div>
                );
            }

            // Inject styles to prevent scrollbars and force full size
            const fixedContent = `
                <style>
                    body { margin: 0; overflow: hidden; width: 100vw; height: 100vh; }
                </style>
                ${localContent}
            `;

            return (
                <div className="w-full h-full bg-white rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
                    <iframe
                        srcDoc={fixedContent}
                        className="w-full h-full block"
                        sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                        title="Canvas Preview"
                    />
                </div>
            );
        }

        // Document Preview (Markdown)
        return (
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg overflow-y-auto h-full prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {localContent}
                </ReactMarkdown>
            </div>
        );
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'code-block'],
            ['clean']
        ],
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-white/10 shadow-xl"
        >
            {/* Header */}
            <div className="relative z-10 h-[60px] px-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                        {type === 'code' ? <Code size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-100">{title}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{type} Canvas</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {!isEditing && (
                        <>
                            {/* Export Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setExportOpen(!exportOpen)}
                                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors"
                                    title="Export"
                                >
                                    <Download size={16} />
                                </button>

                                {exportOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1 z-50 flex flex-col">
                                        <button
                                            onClick={() => { onSaveToNotes(localContent); setExportOpen(false); }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-left"
                                        >
                                            <FileText size={14} /> Save to Notes
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-left"
                                        >
                                            <Download size={14} /> Download PDF
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleCopy}
                                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md transition-colors relative"
                                title="Copy Content"
                            >
                                {showCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>

                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                                title="Edit"
                            >
                                <Edit3 size={16} />
                            </button>
                        </>
                    )}

                    {isEditing && (
                        <button
                            onClick={handleSave}
                            className="p-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium px-3 mr-1"
                        >
                            <Save size={14} /> Done
                        </button>
                    )}

                    <div className="w-[1px] h-4 bg-zinc-200 dark:bg-white/10 mx-1" />

                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-zinc-100/50 dark:bg-black/20 p-4">
                {isEditing ? (
                    type === 'document' ? (
                        <div className="h-full bg-white dark:bg-zinc-900 rounded-lg overflow-hidden flex flex-col">
                            <ReactQuill
                                theme="snow"
                                value={htmlContent}
                                onChange={setHtmlContent}
                                modules={modules}
                                className="h-full flex flex-col"
                            />
                        </div>
                    ) : (
                        <textarea
                            value={localContent}
                            onChange={(e) => setLocalContent(e.target.value)}
                            className="w-full h-full resize-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-zinc-800 dark:text-zinc-200"
                            spellCheck={false}
                        />
                    )
                ) : (
                    renderPreview()
                )}
            </div>

            {/* Styles for Quill Dark Mode Override */}
            <style>{`
                .quill { display: flex; flex-direction: column; height: 100%; }
                .ql-container { flex: 1; overflow-y: auto; font-family: 'Inter', sans-serif; font-size: 1rem; }
                .ql-toolbar { border-top: none !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #e4e4e7 !important; background: transparent; }
                .dark .ql-toolbar { border-bottom-color: rgba(255,255,255,0.1) !important; }
                .dark .ql-stroke { stroke: #a1a1aa !important; }
                .dark .ql-fill { fill: #a1a1aa !important; }
                .dark .ql-picker { color: #a1a1aa !important; }
                .dark .ql-editor { color: #e4e4e7; }
                .ql-editor.ql-blank::before { color: #a1a1aa; font-style: normal; }
            `}</style>
        </motion.div>
    );
};

export default CanvasPanel;
