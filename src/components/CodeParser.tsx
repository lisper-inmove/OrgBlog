"use client";
import React from 'react';
import { useState, SyntheticEvent } from "react";
import { MdOutlineContentCopy, MdCheckCircle } from 'react-icons/md'

import { styled } from '@mui/system';

import { Constants } from '@/utils/constants';
import styles from './CodeParser.module.css';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Props {
  line: string,
  language: string,
  filename: string,
}

export default function CodeParser({line, language, filename}: Props) {
  let showLineNumbers = true;
  if (language == 'picture') {
    showLineNumbers = false;
  }
  return (
    <div className={styles.codeBody}>
      <CopyBtn codeText={line} filename={filename} language={language}>
        <SyntaxHighlighter 
          language={language}
          style={oneDark}
          showLineNumbers={showLineNumbers}
        >
          {line}
        </SyntaxHighlighter>
      </CopyBtn>
    </div>
  );
};

interface CopyBtnProps {
  children: JSX.Element,
  codeText: string,
  filename: string,
  language: string,
}

function CopyBtn({children, codeText, filename, language}: CopyBtnProps) {

  const [copied, setCopied] = useState(false);

  const handleClick = (e: SyntheticEvent) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div>
      <div className="flex text-white absolute right-2 top-1">
        <span className="mr-5 text-blue-200">{filename}</span>
        <span className="mr-5 text-blue-200">{language}</span>
        <span className="hover:cursor-pointer transition hover:scale-150">
          { copied ?
            <MdCheckCircle color="green" /> :
            <MdOutlineContentCopy onClick={handleClick} />
          }
        </span>
      </div>
      {children}
    </div>
  )
}
