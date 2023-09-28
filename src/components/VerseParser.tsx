"use client";
import React from 'react';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { getTextStyle } from '@/utils/common';

import { Constants } from '@/utils/constants';
import { Verse } from '@/models/post';
import { ItemValue } from '@/models/post';

interface Props {
  verse: Verse[],
}

// 解析 #+begin_verse #+end_verse
export default function VerseParser({verse}: Props) {

  const renderValue = (itemValue: ItemValue[]) => {
    return itemValue.map((value, index) => {
      let style = getTextStyle(value.style);
      if (value.style == 'li') {
        style = {
          marginLeft: (value.indent * 10) + "px"
        };
      }
      return (
        <span key={index} style={style}>
          {value.value}
          {index < itemValue.length - 1 && ' '}
        </span>
      );
    });
  };
  
  return (<div className="w-9/10 pb-5 mx-auto bg-gray-800 text-gray-200">
    {verse.map((v, index) => (
      <div key={index}>
        {renderValue(v.items)}
      </div>
    ))} 
  </div>);

};
