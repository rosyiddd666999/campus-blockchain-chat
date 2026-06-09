"use client";

import React, { useState } from "react";
import { Loader2, Send } from "lucide-react";

interface PostEditorProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (content: string) => Promise<void> | void;
}

export function PostEditor({
  placeholder = "Tulis jawaban atau respon Anda di sini...",
  submitLabel = "Kirim Kontribusi",
  onSubmit,
}: PostEditorProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative rounded-2xl border border-border bg-card p-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={5}
          disabled={isSubmitting}
          className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0"
        />
        
        <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            {content.length} karakter
          </span>
          
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 px-4 py-2 font-semibold text-white transition-all duration-200 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
export default PostEditor;
