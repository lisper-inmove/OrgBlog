"use client";

import { AppBar, Toolbar, IconButton, InputBase, Tooltip, Popover, MenuItem } from '@mui/material';
import { Search as SearchIcon, Menu as MenuIcon } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Constants } from '@/utils/constants';
import { PostsMetadata } from '@/models/post';
import GithubIcon from '@/icons/GithubIcon';

interface NavbarProps {
  options: PostsMetadata[];
}

export default function Navbar({ options }: NavbarProps) {

  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option => 
    option.keywords.some(keyword => keyword.toLowerCase().includes(searchValue.toLowerCase()))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      } else if (e.key === 'Enter' && selectedIndex !== -1) {
        window.location.href = `/posts/${filteredOptions[selectedIndex].id}`;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredOptions, selectedIndex]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    if (event.target.value) {
      setAnchorEl(searchInputRef.current);
    } else {
      setAnchorEl(null);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" style={{ backgroundColor: Constants.navbarBgColor }}>
      <Toolbar>
        <Link href="/" className="mr-5 text-inherit no-underline">
          <Tooltip title="主页">
            <HomeOutlinedIcon />
          </Tooltip>
        </Link>

        <Link href="https://github.com/lisper-inmove" className="mr-5 text-inherit no-underline">
          <Tooltip title="Github">
            <GithubIcon />
          </Tooltip>
        </Link>

        <div className="flex-grow text-2xl brightness-50 rotate-0">
          Talk is cheap, show me the code
        </div>
        <div className="flex items-center mr-10" >
          <InputBase 
            placeholder="Search…" 
            className="ml-2 border border-white rounded w-96 pl-2 text-white"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={(e) => {
              if (searchValue) {
                e.target.select();  // 选中所有内容
                setAnchorEl(searchInputRef.current);
              }
            }}
            ref={searchInputRef}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            }
          />
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            disableAutoFocus={true}
            disableEnforceFocus={true}
          >
            <div>
              {filteredOptions.map((option, index) => (
                <Link key={option.id} href={`/posts/${option.id}`}>
                  <MenuItem
                    onClick={handleClose}
                    selected={index === selectedIndex}
                  >{option.title}: {option.keywords.join(",")}</MenuItem>
                </Link>
              ))}
            </div>
          </Popover>
        </div>
      </Toolbar>
    </AppBar>
  );
}
