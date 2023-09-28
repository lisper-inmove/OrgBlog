"use client";
import React from 'react';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';

import { Constants } from '@/utils/constants';
import { Quote } from '@/models/post';
import { ItemValue } from '@/models/post';
import { getTextStyle } from '@/utils/common';

interface Props {
  quotes: Quote[]
}

export default function QuoteParser({quotes}: Props) {
  const renderValue = (itemValue: ItemValue[]) => {
    return itemValue.map((value, index) => {
      let style = getTextStyle(value.style);
      return (
        <span key={index} style={style}>
          {value.value}
          {index < itemValue.length - 1 && ' '}
        </span>
      );
    });
  };

  return (<div className="w-9/10 mx-auto bg-gray-700 text-gray-200 p-1 m-2 text-orange-400">
    {quotes.map((v, index) => (
      <div key={index} className="p-1">
        &gt; {renderValue(v.items)}
      </div>
    ))}
  </div>);
}
