import path from 'path';
import fs from 'fs';
import { PostsMetadata } from '@/models/post';

export function getPostsMetadata() {
  const metadataPath = path.join(process.cwd(), 'metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const postsMetadata: PostsMetadata[] = metadata.map((item: any) => ({
    id: item.id,
    path: item.path,
    title: item.title,
    keywords: item.keywords.split(' ').filter((keyword: string) => keyword.trim() !== ''), 
    categories: item.categories.split(' ').filter((keyword: string) => keyword.trim() !== ''),
    difficulty: item.difficulty,
  }));
  return postsMetadata;
}

