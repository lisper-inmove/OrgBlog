"use client";
import React from 'react';

import { Box } from '@mui/material';
import { styled } from '@mui/system';

import TableContent from './TableContent';
import { Property } from '@/models/post';
import { Constants } from '@/utils/constants';

interface Props {
  components: any[],
  headers: any[],
  property: Property,
}

export default function ContentCompontent({components, headers, property}: Props) {

  // 让屏幕底部多留一点空白
  components.push(<div className="mb-10"></div>);

  return (
    <div>
    {headers.length > 1 ? (
      <TableContent headers={headers}/>
      ) : null
    }
    <Box style={{
        color: Constants.postTextColor,
      }}>
      {components.map((component, index) => {
        if (component.props != undefined && component.props.header) {
          return (<div key={index} style={{ 
            marginBottom: '10px',
            textShadow: '2px 2px 4px gray',
          }}>
            {component}
          </div>)
        }
        return (<div key={index} style={{ 
          marginBottom: '10px',
          boxShadow: Constants.contentComponentBoxShadow,
        }}>
          {component}
        </div>)
      })}
    </Box>
    </div>
  );

};
