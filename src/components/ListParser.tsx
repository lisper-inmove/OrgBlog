"use client";
import React from 'react';

import { ListItem } from '@/models/post';
import { ItemValue } from '@/models/post';
import { getTextStyle } from '@/utils/common';
import { Constants } from '@/utils/constants';

interface Props {
  ordered: boolean;
  items: ListItem[];
}

function List({ordered, items}: Props) {

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

  let divClassName = "pl-8 pb-5 w-9/10 mx-auto bg-gray-800 text-gray-200";
  let ulDivClassName = "pl-8 w-9/10 mx-auto bg-gray-800 text-gray-200";
  let liStyle = {
    // marginTop: "5px",
    color: Constants.liTextColor,
  };

  let textColors = [
    Constants.liTextColor,
    Constants.li2TextColor,
    Constants.li3TextColor,
    Constants.li4TextColor,
    Constants.li5TextColor,
    Constants.li6TextColor,
    Constants.li7TextColor,
    Constants.li8TextColor,
    Constants.li9TextColor,
  ];

  if (ordered) {
    return (
      <div className={divClassName}>
      <ol>
        {items.map((item, index) => (
          <li key={index}
            style={{
              marginLeft: `${item.level * 20}px`,
              color: `${textColors[item.level]}`
            }}
          >{item.index}. {renderValue(item.items)}</li>
        ))}
      </ol>
      </div>
    );
  } else {
    return (
      <div className={ulDivClassName}>
      <ul>
        {items.map((item, index) => (
          <li key={index} style={{
            marginLeft: `${item.level * 20}px`,
            ...liStyle,
            }}>- {renderValue(item.items)} </li>
        ))}
      </ul>
      </div>
    );
  }
}

export default List;
