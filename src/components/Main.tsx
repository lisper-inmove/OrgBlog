"use client";
import Link from 'next/link';
import React, { useMemo, useState, useEffect } from 'react';

import { Card } from '@mui/material';

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
    metadata.forEach(m => {
      m.categories.forEach(category => {
        if (!result[category]) {
          result[category] = {
            category,
            posts: [],
          };
        }
        result[category].posts.push(m);
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
   <div className="flex">
    <div className="w-[20vw] mr-1">
      <div className="flex flex-col fixed w-[20vw] p-4 pl-2 h-[91vh] justify-between">

        {/* Personal Information */}
        <div className="flex items-center pl-1" style={{ 
            flex: '1',
            boxShadow: Constants.introBoxShadow,
            backgroundColor: Constants.introBgColor,
            border: Constants.introBorder,
          }}>
          <img src="https://z1.ax1x.com/2023/09/29/pPbqOyV.jpg" alt="Avatar" className="w-20 h-20 mr-4 rounded-full" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white">Inmove</h1>
            <h2 className="text-white"
              style={{
                textShadow: Constants.categoryTextShadow,
              }}
            >
              &nbsp;&nbsp;最光荣的时刻就是现在
            </h2>
          </div>
        </div>

        {/* Category List */}
        <div className="mb-4 mt-3 pt-3 overflow-y-auto flex flex-col items-center" style={{ 
          flex: '9',
          boxShadow: Constants.introBoxShadow,
          backgroundColor: Constants.introBgColor,
          color: Constants.introTextColor,
        }}>
          {Object.keys(metadataByCategory).map(category => (
            <Card
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`m-1 p-2 flex items-center justify-center hover:cursor-pointer flex-shrink-0 hover:scale-95 mx-auto transition-transform transform`}

              style={{
                fontSize: Constants.categoryFontSize,
                textShadow: Constants.categoryTextShadow,
                width: "85%",
                height: "50px",
                backgroundColor: Constants.categoryCardBgColor,
                color: Constants.introTextColor,
                boxShadow: selectedCategory == category ? Constants.categoryCardcSelectedBoxShadow : "",
              }}
            >
              {category}
            </Card>
          ))}
        </div>
      </div>
      </div>

      <div className="w-3/4">
      <div
        className="p-4 overflow-auto"
      >
        {selectedCategory && (
          <div>
            {metadataByCategory[selectedCategory].posts.map(post => (
              <div key={post.id} className="mb-4 p-4 mt-1 border-b border-blue-200 rounded"
                style={{
                  backgroundColor: Constants.postListBgColor,
                  boxShadow: '-10px 0px 13px -7px #000000, 10px 0px 13px -7px #000000, 35px -23px 2px -16px rgba(0, 0, 0, 0)',
                }}
              >
                <div className="flex justify-between items-center">
                  <Link href={`/posts/${post.id}`}>
                    <h1
                      className="text-lg font-bold"
                      style={{
                        color: Constants.postTitleTextColor,
                        display: "inline",
                        textShadow: Constants.postListTextShadow,
                      }}
                    >{post.title}</h1>
                  </Link>
                  {post.difficulty && (
                    <span
                      className="pr-40 text-3xl"
                      style={{
                          color: difficultyFontColor[post.difficulty as keyof typeof difficultyFontColor],
                          textShadow: Constants.postListDifficultyTextShadow,
                        }}
                    >{post.difficulty}</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {post.subtitle}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
