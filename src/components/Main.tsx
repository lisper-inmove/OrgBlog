"use client";
import Link from 'next/link';
import React, { useMemo, useState, useEffect } from 'react';

import { Constants } from '@/utils/constants';
import { PostsMetadata } from '@/models/post';
import { PostsMetadataByCategory } from '@/models/post';
import { Difficulty } from '@/models/post';

interface Props {
  metadata: PostsMetadata[],
}

export function Main({ metadata }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const metadataByCategory = useMemo(() => {
    const result: Record<string, PostsMetadataByCategory> = {};
    const leetcode = "Leetcode";
    metadata.forEach(m => {
      m.categories.forEach(category => {
        if (category == leetcode) {
          if (!result[category]) {
            result[category] = {
              category,
              posts: [],
            };
          }
          result[category].posts.push(m);
        }
      });
    });

    metadata.forEach(m => {
      m.categories.forEach(category => {
        if (category != leetcode) {
          if (!result[category]) {
            result[category] = {
              category,
              posts: [],
            };
          }
          result[category].posts.push(m);
        }
      });
    });
    return result;
  }, [metadata]);

  useEffect(() => {
    // Set the first category as the default selectedCategory
    const firstCategory = Object.keys(metadataByCategory)[0];
    if (firstCategory) {
      setSelectedCategory(firstCategory);
    }
  }, [metadataByCategory]);

  function getRandomClassName() {
    const textColors = ['text-blue-500', 'text-red-500', 'text-green-500', 'text-yellow-500', 'text-purple-500'];
    const hoverColors = ['hover:text-blue-700', 'hover:text-red-700', 'hover:text-green-700', 'hover:text-yellow-700', 'hover:text-purple-700'];
    const fontSizes = [ 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl' ];

    const randomIndex = Math.floor(Math.random() * textColors.length);
    const randomFontSizeIndex = Math.floor(Math.random() * fontSizes.length);
    return `${textColors[randomIndex]} ${hoverColors[randomIndex]} ${fontSizes[randomFontSizeIndex]} cursor-pointer mr-2`;
  }

  let difficultyFontColor: Record<Difficulty, string> = {
    "Hard": Constants.hardFontColor,
    "Medium": Constants.mediumFontColor,
    "Easy": Constants.easyFontColor,
  };

  return (
    <div>
      <div className="mb-4">
        {Object.keys(metadataByCategory).map(category => (
          <span
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={getRandomClassName()}
          >
            {category}
          </span>
        ))}
      </div>
      <hr />
      {selectedCategory && (
        <div>
          {metadataByCategory[selectedCategory].posts.map(post => (
            <div key={post.id} className="mb-4 p-4 mt-10 border-b border-blue-200 rounded shadow">
              <div className="flex justify-between items-center">
                <Link href={`/posts/${post.id}`}>
                  <h1
                    className="text-lg font-bold"
                    style={{
                      color: Constants.postTitleTextColor,
                      display: "inline",
                    }}
                  >{post.title}</h1>
                </Link>
                {post.difficulty && (
                  <span
                    className="pr-40 text-3xl"
                    style={{
                        color: difficultyFontColor[post.difficulty as keyof typeof difficultyFontColor],
                      }}
                  >{post.difficulty}</span>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {post.keywords.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
