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
}

export default function CodeParser({line, language}: Props) {
  return (
    <div className={styles.codeBody}>
      <CopyBtn codeText={language}>
        <SyntaxHighlighter language={language} style={oneDark} >
          {line}
        </SyntaxHighlighter>
      </CopyBtn>
    </div>
  );
};

interface CopyBtnProps {
  children: JSX.Element
  codeText: string
}

function CopyBtn({children, codeText}: CopyBtnProps) {
  
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
      <span className="text-white absolute right-2 top-1 hover:cursor-pointer transition hover:scale-150">
        { copied ? 
          <MdCheckCircle color="green" /> :
          <MdOutlineContentCopy onClick={handleClick} />
        }
      </span>
      {children}
    </div>
  )
}

