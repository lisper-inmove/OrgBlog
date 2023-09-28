"use client";
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Header } from '@/models/post';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface TableContentProps {
  headers: Header[],
}

export default function TableContent({headers}: TableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  let tableContent = renderTableHeader(headers);

  return (
    <Box
      className={`z-0 hover:z-50 fixed top-50 left-5 p-2 bg-gray-700 text-white rounded-md transition-all duration-300 ${isExpanded ? 'w-96' : 'w-10'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {isExpanded ? "" : <ExpandMoreIcon /> }
      {isExpanded ? tableContent : ''}
    </Box>
  );
}

const renderTableHeader = (headers: Header[]): JSX.Element => {

  const handleClick = (index: string) => {
    const element = document.getElementById(index);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {headers.map((header) => (
        <div
          key={header.index}
          className="ml-1 hover:bg-gray-500"
          style={{ marginLeft: `${(header.level - 1) * 2}em` }}
        >
          <a
            href={`#${header.index}`}
            onClick={(e: any) => {
                e.preventDefault();
                handleClick(header.index);
              }
            }
          >
            {header.index}. {header.name}
          </a>
        </div>
      ))}
    </div>
  );
};
