"use client";
import React from 'react';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';

import { Constants } from '@/utils/constants';
import { Paragraph } from '@/models/post';
import { ItemValue } from '@/models/post';
import { getTextStyle } from '@/utils/common';

interface Props {
  paragraph: Paragraph,
}

export default function ParagraphParser({paragraph}: Props) {
  const renderValue = (itemValue: ItemValue[]) => {
    return itemValue.map((item, index) => {
      let style = getTextStyle(item.style);
      if (item.value == '\n') {
        return (<br key={index} />);
      }
      return (
        <span key={index} style={style}>
          {item.value}
          {index < itemValue.length - 1 && ' '}
        </span>
      );
    });
  };

  return (<div className="w-9/10 mx-auto bg-gray-800 text-gray-200">
      <div className="p-1">
        {renderValue(paragraph.items)}
      </div>
  </div>);
}
