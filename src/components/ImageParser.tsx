"use client";
import React from 'react';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';

import Image from 'next/image';
import { Constants } from '@/utils/constants';
import { getTextStyle } from '@/utils/common';

interface Props {
  link: string;
}

export default function ImageParser({link}: Props) {
  return (<div style={{
      width: "80%",
      marginLeft: "auto",
      marginRight: "auto",
      marginBottom: "10px",
    }}>
    <img src={link} style={{
      width: "100%",
      marginLeft: "auto",
      marginRight: "auto",
    }}/>
  </div>)
}
