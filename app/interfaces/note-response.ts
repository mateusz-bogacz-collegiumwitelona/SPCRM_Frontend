export interface NoteResponse {
  noteId: string;
  title: string;
  content: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
  updatedAt?: string;
}
