export const LOADING = "Loading...";

// firebase collection names
export const POSTS = "posts";

// post field names
export const AUTHOR = "author";
export const CONTENT = "content";
export const CREATED_AT = "createdAt";
export const DESCRIPTION = "description";
export const IMAGE = "image";
export const LOCATION = "location";
export const PUBLISHED = "published";
export const TAGS = "tags";
export const TITLE = "title";
export const UPDATED_AT = "updatedAt";
export const SLUG = "slug";

export const POST_FIELDS = [
  AUTHOR,
  CONTENT,
  CREATED_AT,
  DESCRIPTION,
  IMAGE,
  LOCATION,
  PUBLISHED,
  TAGS,
  TITLE,
  UPDATED_AT,
] as const;

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

// Storage paths

export const IMAGES = "images";
