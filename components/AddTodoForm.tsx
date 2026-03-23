'use client';

import { useState } from 'react';

interface Props {
  onAdd: (text: string, deadline: string | null) => Promise<void>;
}

export default function AddTodoForm({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd(text.trim(), deadline || null);
      setText('');
      setDeadline('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new todo..."
          className="w-full text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-400 transition-colors"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="text-sm text-zinc-500 border border-zinc-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-zinc-400 transition-colors"
          disabled={isSubmitting}
          title="Set deadline (optional)"
        />
      </div>
      <button
        type="submit"
        disabled={!text.trim() || isSubmitting}
        className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Add
      </button>
    </form>
  );
}
