export const LOADING = "Loading...";

// firebase collection names
export const POSTS = "posts";

// post field names
export const AUTHOR = "author";
export const CONTENT = "content";
export const CREATED_AT = "createdAt";
export const DESCRIPTION = "description";
export const DRAFT_EDITOR_STATE = "draftEditorState";
export const HAS_UNSAVED_CHANGES = "hasUnsavedChanges";
export const IMAGE = "image";
export const LOCATION = "location";
export const PUBLISHED = "published";
export const SAVED_EDITOR_STATE = "savedEditorState";
export const TAGS = "tags";
export const TITLE = "title";
export const UPDATED_AT = "updatedAt";

export const POST_FIELDS = [
  AUTHOR,
  CONTENT,
  CREATED_AT,
  DESCRIPTION,
  DRAFT_EDITOR_STATE,
  HAS_UNSAVED_CHANGES,
  IMAGE,
  LOCATION,
  PUBLISHED,
  SAVED_EDITOR_STATE,
  TAGS,
  TITLE,
  UPDATED_AT,
];

export const DEFAULT_POST = {
  author: "Franco May",
  date: "A long time ago",
  description: "This is a description",
  image: "https://source.unsplash.com/random/800x600",
  location: "The Internet",
  tags: ["tag1", "tag2", "tag3"],
  title: "Untitled",
  content: [
    {
      type: "text",
      blockId: "1",
      content: "This is a text block",
    },
  ],
};
