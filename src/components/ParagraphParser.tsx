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
      } else if (item.style == "link") {
        let text = item.value.split("||")[0];
        let href = item.value.split("||")[1];
        return (<a key={index} href={href} style={{
            color: "red",
          }}>{text}</a>);
      }
      return (
        <span key={index} style={style}>
          {item.value}
          {index < itemValue.length - 1 && ' '}
        </span>
      );
    });
  };

  return (<div className="w-9/10 p-2 mx-auto bg-gray-800 text-gray-200 leading-7">
    <div className="p-1"
    >
      {renderValue(paragraph.items)}
    </div>
  </div>);
}
