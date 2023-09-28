export type Difficulty = 'Hard' | 'Medium' | 'Easy';

export type PostsMetadata = {
  id: string;
  title: string;
  keywords: string[];
  path: string;
  categories: string[];
  difficulty: Difficulty;
}

export type TableHeader = {
  name: string;
  children: TableHeader[];
  prefix: string;
}

export type ItemValue = {
  style: string;
  value: string;
  indent: number;
}

export type ListItem = {
  items: ItemValue[];
  level: number;
  index: number;
}

export type Verse = {
  items: ItemValue[];
}

export type PostsMetadataByCategory = {
  category: string;
  posts: PostsMetadata[],
}

export type Paragraph = {
  items: ItemValue[];
}

export type Quote = {
  items: ItemValue[];
}

export interface Property {
  title: string;
  subtitle: string;
  createDate: Date;
  updateDate: Date;
  category: string;
}
export interface Header {
  name: string;
  level: number;
  tags: string[];
  index: string;
}
