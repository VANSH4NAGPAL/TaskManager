"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, CheckSquare, Heading1, Heading2 } from 'lucide-react'
import { useEffect } from 'react'

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    editable?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder = "Write something...", editable = true }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none min-h-[200px] p-4 text-gray-700 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2',
            },
        },
        immediatelyRender: false,
    });

    // Sync external value changes - THIS IS CRITICAL for AI content to appear
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Use commands to update content without losing focus state
            editor.commands.setContent(value, { emitUpdate: false } as any);
        }
    }, [value, editor]);

    if (!editor) {
        // Loading skeleton
        return (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white h-full animate-pulse">
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                </div>
                <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        )
    }

    interface ToolbarButtonProps {
        onClick: () => void;
        isActive: boolean;
        icon: React.ElementType;
        title: string;
    }

    const ToolbarButton = ({ onClick, isActive, icon: Icon, title }: ToolbarButtonProps) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-md transition-colors ${isActive ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
            title={title}
        >
            <Icon className="w-4 h-4" />
        </button>
    )

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all h-full flex flex-col">
            {editable && (
                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={Bold}
                        title="Bold"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={Italic}
                        title="Italic"
                    />
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        icon={Heading1}
                        title="Heading 1"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={Heading2}
                        title="Heading 2"
                    />
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={List}
                        title="Bullet List"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={ListOrdered}
                        title="Ordered List"
                    />
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        isActive={editor.isActive('taskList')}
                        icon={CheckSquare}
                        title="Task List"
                    />
                </div>
            )}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
            <style jsx global>{`
                .ProseMirror {
                    min-height: 100%;
                }
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5em;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5em;
                }
                .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                .ProseMirror li[data-type="taskItem"] {
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-start;
                    margin-bottom: 0.25rem;
                }
                .ProseMirror input[type="checkbox"] {
                    margin-top: 0.3em;
                    cursor: pointer;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #9ca3af;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>
    )
}
