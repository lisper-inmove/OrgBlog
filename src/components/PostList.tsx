"use client";

import Link from 'next/link';

import { Constants } from '@/utils/constants';
import { PostsMetadata } from '@/models/post';


interface Props {
  metadata: PostsMetadata[],
}

export function PostList({metadata}: Props) {
  return (
    <div style={{ backgroundColor: Constants.homeBgColor, }}>
      { metadata.map((post, index) => (
        <div key={post.id} className="mb-4 p-4 rounded shadow">
          <Link href={`/posts/${post.id}`} className="text-blue-500">
              <h2 
                className="text-xl font-bold"
                style={{ 
                  color: Constants.postTitleTextColor,
                  display: "inline"
                }}
              >
                <span>{post.title}</span>
              </h2>
          </Link>
          {index !== metadata.length - 1 && <hr className="mt-4" />}
        </div>
      ))}
    </div>
  );
}
