export interface NoteResponse {
  noteId: string;
  title: string;
  content: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
  updatedAt?: string;
}
