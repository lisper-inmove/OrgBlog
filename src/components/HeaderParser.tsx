"use client";
import React from 'react';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/system';

import { Header } from '@/models/post';
import { Constants } from '@/utils/constants';

interface Props {
  header: Header;
}

const H1StyledTypography = styled(Typography)({
  fontSize: Constants.h1FontSize,
  marginLeft: Constants.h1MarginLeft,
  color: Constants.h1TextColor,
});

const H2StyledTypography = styled(Typography)({
  fontSize: Constants.h2FontSize,
  marginLeft: Constants.h2MarginLeft,
  color: Constants.h2TextColor,
});

const H3StyledTypography = styled(Typography)({
  fontSize: Constants.h3FontSize,
  marginLeft: Constants.h3MarginLeft,
  color: Constants.h3TextColor,
});

const H4StyledTypography = styled(Typography)({
  fontSize: Constants.h4FontSize,
  marginLeft: Constants.h4MarginLeft,
  color: Constants.h4TextColor,
});

const H5StyledTypography = styled(Typography)({
  fontSize: Constants.h5FontSize,
  marginLeft: Constants.h5MarginLeft,
  color: Constants.h5TextColor,
});

const H6StyledTypography = styled(Typography)({
  fontSize: Constants.h6FontSize,
  marginLeft: Constants.h6MarginLeft,
  color: Constants.h6TextColor,
});

export default function HeaderParser({header}: Props) {

  let StyledTypography;

  switch (header.level) {

    case 1:
      StyledTypography = H1StyledTypography;
      break;
    case 2:
      StyledTypography = H2StyledTypography;
      break;
    case 3:
      StyledTypography = H3StyledTypography;
      break;
    case 4:
      StyledTypography = H4StyledTypography;
      break;
    case 5:
      StyledTypography = H5StyledTypography;
      break;
    case 6:
      StyledTypography = H6StyledTypography;
      break;
    default:
      StyledTypography = H6StyledTypography;
      break;
  }

  let tags = ":" + header.tags.join(":") + ":";

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" style={{margin: "10px"}}>
      <StyledTypography variant={`h${header.level}` as any}>
        <a href={`#${header.index}`} id={header.index} style={{ textDecoration: 'none', color: 'inherit' }}>
          {header.index}. {header.name}
        </a>
      </StyledTypography>
      {tags != "::" && (
      <Box display="flex" gap={2}>
        <Typography style={{
          color: Constants.headerTagColor,
          fontWeight: 'bold',
          fontSize: Constants.headerTagSize,
        }}>{tags}</Typography>
      </Box>)}
    </Box>
  );

};
