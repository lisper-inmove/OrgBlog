---
title: 简单动态字符串
date: 2023-09-11 21:05:39
summary:
keywords: Redis SDS
prefix: Redis
---

# 简单动态字符串 (SDS)

  简单动态字符串就是对C字符串的一个封装。至少在获取字符串长度这方面要更加简单了。

  ```c
  struct __attribute__ ((__packed__)) sdshdr5 {
      // 最低有效位(Least Significant Bit)
      // 低三位表示类型，其余5位表示字符串的长度
      // 所以sdshdr5的最大长度为31
      unsigned char flags; /* 3 lsb of type, and 5 msb of string length */
      char buf[];
  };
  struct __attribute__ ((__packed__)) sdshdr8 {
      uint8_t len; /* used */
      uint8_t alloc; /* 实际分配的内存大小 */
      unsigned char flags; /* 3 lsb of type, 5 unused bits */
      char buf[];
  };
  struct __attribute__ ((__packed__)) sdshdr16 {
      uint16_t len; /* used */
      uint16_t alloc; /* excluding the header and null terminator */
      unsigned char flags; /* 3 lsb of type, 5 unused bits */
      char buf[];
  };
  struct __attribute__ ((__packed__)) sdshdr32 {
      uint32_t len; /* used */
      uint32_t alloc; /* excluding the header and null terminator */
      unsigned char flags; /* 3 lsb of type, 5 unused bits */
      char buf[];
  };
  struct __attribute__ ((__packed__)) sdshdr64 {
      uint64_t len; /* used */
      uint64_t alloc; /* excluding the header and null terminator */
      unsigned char flags; /* 3 lsb of type, 5 unused bits */
      char buf[];
  };
  ```
## 新建字符串
  ```c
  sds _sdsnewlen(const void *init, size_t initlen, int trymalloc) {
      void *sh;
      sds s;

      // 根据长度决定要使用哪种类型
      char type = sdsReqType(initlen);

      // 这里不可能是 SDS_TYPE_5
      if (type == SDS_TYPE_5 && initlen == 0) type = SDS_TYPE_8;

      // 获得结构体的长度
      int hdrlen = sdsHdrSize(type);

      unsigned char *fp; /* flags pointer. */
      size_t usable;

      // 为sh分配内存并做初始化
      assert(initlen + hdrlen + 1 > initlen); /* Catch size_t overflow */

      // 分配空间，返回的指针保存在 sh中
      // hdrlen+initlen+1表示分配的长度
      // usable这里传过去之后会得到实际分配的长度。在ztrymalloc_usable_internal函数里有个PREFIX_SIZE
      // 如果这个有设置，HAVE_MALLOC_SIZE那么usable就等于 hdrlen + ininlen + 1 + PREFIX_SIZE，否则就和前一个参数相等
      // 这两个malloc功能是一样的，只是trymalloc这个函数会在分配失败时abort
      sh = trymalloc?
          s_trymalloc_usable(hdrlen+initlen+1, &usable) :
          s_malloc_usable(hdrlen+initlen+1, &usable);
      if (sh == NULL) return NULL;
      if (init==SDS_NOINIT)
          init = NULL;
      else if (!init)
          memset(sh, 0, hdrlen+initlen+1);

      // sh其实只是一个指针，真正的字符串是保存在 buf 成员中的
      // 所以这里的s其实是指向的 buf 成员
      s = (char*)sh+hdrlen;

      // 指向向前移一个位置，fp指向 flags成员
      fp = ((unsigned char*)s)-1;

      // usable要么等于 initlen(未设置HAVE_MALLOC_SIZE时)，要么等于 initlen + PREFIX_SIZE
      usable = usable-hdrlen-1;

      // usable用来初始化alloc成员，所以它的容量不能超过最大
      if (usable > sdsTypeMaxSize(type))
          usable = sdsTypeMaxSize(type);

      // 做初始化操作
      switch(type) {
          case SDS_TYPE_5: { // 这里应该永远执行不到，因为前面有做特殊处理
              *fp = type | (initlen << SDS_TYPE_BITS);
              break;
          }
          case SDS_TYPE_8: {
              SDS_HDR_VAR(8,s);
              sh->len = initlen;
              sh->alloc = usable;
              *fp = type;
              break;
          }
          case SDS_TYPE_16: {
              SDS_HDR_VAR(16,s);
              sh->len = initlen;
              sh->alloc = usable;
              *fp = type;
              break;
          }
          case SDS_TYPE_32: {
              SDS_HDR_VAR(32,s);
              sh->len = initlen;
              sh->alloc = usable;
              *fp = type;
              break;
          }
          case SDS_TYPE_64: {
              SDS_HDR_VAR(64,s);
              sh->len = initlen;
              sh->alloc = usable;
              *fp = type;
              break;
          }
      }
      if (initlen && init)
          memcpy(s, init, initlen);
      s[initlen] = '\0';

      // s其实是指向的buf成员
      // 这里是为了和c现有的函数作兼容。
      // s是个指针 s[-1] 是flag
      // 根据定义，有了这个flag就能知道它的类型，
      // 知道类型就能知道大小，再有s的起始地址，也就能得到结构体的起始地址了
      /** 从free函数就能看出来他是如何从 s得到原始结构体的
      void sdsfree(sds s) {
          if (s == NULL) return;
              s_free((char*)s-sdsHdrSize(s[-1]));
      }
      */
      return s;
  }
  ```
  ```c
  #ifdef HAVE_MALLOC_SIZE
  #define PREFIX_SIZE (0)
  #else
  /* Use at least 8 bits alignment on all systems. */
  #if SIZE_MAX < 0xffffffffffffffffull
  #define PREFIX_SIZE 8
  #else
  #define PREFIX_SIZE (sizeof(size_t))
  #endif
  #endif

  // s_malloc_usable 实际调用的函数
  void *zmalloc_usable(size_t size, size_t *usable) {
      size_t usable_size = 0;
      void *ptr = ztrymalloc_usable_internal(size, &usable_size);
      if (!ptr) zmalloc_oom_handler(size);
  #ifdef HAVE_MALLOC_SIZE
      ptr = extend_to_usable(ptr, usable_size);
  #endif
      if (usable) *usable = usable_size;
      return ptr;
  }

  // s_trymalloc_usable 实际调用的函数
  void *ztrymalloc_usable(size_t size, size_t *usable) {
      size_t usable_size = 0;
      void *ptr = ztrymalloc_usable_internal(size, &usable_size);
  #ifdef HAVE_MALLOC_SIZE
      ptr = extend_to_usable(ptr, usable_size);
  #endif
      if (usable) *usable = usable_size;
      return ptr;
  }

  // 上面两个函数调用的函数。这里会设置 usable
  static inline void *ztrymalloc_usable_internal(size_t size, size_t *usable) {
      /* Possible overflow, return NULL, so that the caller can panic or handle a failed allocation. */
      if (size >= SIZE_MAX/2) return NULL;
      void *ptr = malloc(MALLOC_MIN_SIZE(size)+PREFIX_SIZE);

      if (!ptr) return NULL;
  #ifdef HAVE_MALLOC_SIZE
      size = zmalloc_size(ptr);
      update_zmalloc_stat_alloc(size);
      if (usable) *usable = size;
      return ptr;
  #else
      *((size_t*)ptr) = size;
      update_zmalloc_stat_alloc(size+PREFIX_SIZE);
      if (usable) *usable = size;
      return (char*)ptr+PREFIX_SIZE;
  #endif
  }
  ```