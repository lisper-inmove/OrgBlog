"use client";
import React from 'react';

interface Props {
  data: any[][];
  caption: string;
}

function Table({data, caption}: Props) {
  if (data.length === 0) {
    return <p className="text-white text-center">No data available</p>;
  }

  return (
    <div className="flex flex-col justify-center items-center bg-gray-800 p-4">
      <table className="min-w-max w-4/5 table-auto border">
        <thead>
          <tr className="bg-gray-600 text-white uppercase text-sm leading-normal">
            {data[0].map((column, columnIndex) => (
              <th key={columnIndex} className="py-3 px-6 text-left border text-center">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-200">
          {data.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex} className='bg-gray-800 border hover:bg-gray-500'>
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex} 
                  className="py-3 px-6 text-left whitespace-nowrap border text-center"
                >{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption != "" ? <div className="text-2xl text-white mb-4">{caption}</div> : "" }
    </div>
  );
}

export default Table;
