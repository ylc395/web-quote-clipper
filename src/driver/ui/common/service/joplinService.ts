export const openNote = (noteId: string) => {
  window.open(`joplin://x-callback-url/openNote?id=${noteId}`);
};
