import React from 'react';

interface NoteFormFieldsProps {
  readonly title: string;
  readonly content: string;
  readonly onTitleChange: (value: string) => void;
  readonly onContentChange: (value: string) => void;
  readonly disabled?: boolean;
}

export function validateNoteForm(title: string, content: string): string[] {
  const errors: string[] = [];
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle) {
    errors.push('Tytuł notatki jest wymagany.');
  } else if (trimmedTitle.length > 50) {
    errors.push('Tytuł notatki nie może przekraczać 50 znaków.');
  }

  if (!trimmedContent) {
    errors.push('Treść notatki jest wymagana.');
  } else if (trimmedContent.length > 500) {
    errors.push('Treść notatki nie może przekraczać 500 znaków.');
  }

  return errors;
}

export function NoteFormFields({
  title,
  content,
  onTitleChange,
  onContentChange,
  disabled = false,
}: NoteFormFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="note-title-input" className="text-sm font-medium text-gray-700">
          Tytuł <span className="text-red-500">*</span>
        </label>
        <input
          id="note-title-input"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={50}
          disabled={disabled}
          placeholder="Wprowadź tytuł notatki"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <div className="text-right text-xs text-gray-500">{title.length}/50</div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note-content-input" className="text-sm font-medium text-gray-700">
          Treść notatki <span className="text-red-500">*</span>
        </label>
        <textarea
          id="note-content-input"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          maxLength={500}
          disabled={disabled}
          placeholder="Wpisz treść notatki..."
          className="flex min-h-36 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand resize-y"
        />
        <div className="text-right text-xs text-gray-500">{content.length}/500</div>
      </div>
    </>
  );
}
