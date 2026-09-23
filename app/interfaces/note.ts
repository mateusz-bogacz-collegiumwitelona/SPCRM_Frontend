export interface Note {
  noteId: string;
  title: string;
  content: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NoteEditData {
  id: string;
  title: string;
  content: string;
}

export interface AddNotePayload {
  targetId: string;
  title: string;
  content: string;
  noteType: 'Contact' | 'Deal' | 'Task';
}
