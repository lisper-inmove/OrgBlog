---
title: 压缩链表
date: 2023-09-11 21:06:56
summary:
keywords: Redis Ziplist
prefix: Redis
---

# 压缩表 (ZipList)
  压缩表其实就是分配一段内存空间，规定了这段内存空间的布局。

## 布局
  压缩表布局: **<zlbytes> <zltail> <zllen> <entry> <entry> ... <entry> <zlend>**
  1. uint32_t zlbytes: 无符号数字。ziplist一共占用了多少个字节，包括zlbytes占用的4个字节。
  2. uint32_t zltail: 最一个节点的位置偏移量。这样在pop的时候就能达到O(1)了
  3. uint16_t zllen: 结点个数。如果个数超过了 2^16 - 2，那么会被设置为 2^16 - 1，这个时候需要遍历整个ziplist来知道一共有多个少结点。
  4. uint8_t zlend: 被设置为255，表示ziplist的终结。

## 结点(也就是上面的entry)
  结点结构体:
  ```c
  /* Each entry in the ziplist is either a string or an integer. */
  typedef struct {
    /* When string is used, it is provided with the length (slen). */
    unsigned char *sval;
    unsigned int slen;
    /* When integer is used, 'sval' is NULL, and lval holds the value. */
    long long lval;
  } ziplistEntry;
  ```

  每个entry有两/三部分组成: <prevlen> <encoding> <entry-data>
  1. prevlen: 保存了前一个entry的长度。也就是说可能通过当前entry的地址做一个减法，就能得到前一个entry了
  2. encoding: entry的类型。数字或者字符串，如果是字符中，同时也会保存字符串的长度
  3. entry-data: 根据encoding，有可能会有。

### prevlen
  1. 占用一个字节: 当数据长度小于254的时候
  2. 占用五个字节: 当数据长度大于等于254的时候，其中第一个字节被设置为 254(FE)，其余4个字节表示实际数据长度

### encoding
  1. 00pp pppp: 1个字节 表示最多占用 63个字节的字符串
  2. 01pp pppp qqqq qqqq: 2个字节，表示最多占用16383个字节的字符串
  3. 1000 0000 4个字节: 一共占用5个字节，后4个字节表示一共占用了 2^32 - 1个字节的字符串 _IMPORTANT: The 32 bit number is stored in big endian._
  4. 1100 0000: 2个字节(当前字节后面的两个字节)的数字。相当于，int16_t
  5. 1101 0000: 4个字节的数字。int32_t
  6. 1110 0000: 8个字节的数字。int64_t
  7. 1111 0000: 3个字节的有符号数字
  8. 1111 xxxx: 从0001 ~ 1101的立即数。从二进制上来看是1~13，实际使用的时候代表的是 0~12
  9. 1111 1111: ziplist的结尾。也就是zlend

  *Like for the ziplist header, all the integers are represented in little endian byte order, even when this code is compiled in big endian systems.*

### ziplist的一个例子
  ```c
  /**

   从左到右，从低位到高位

   [0f 00 00 00] [0c 00 00 00] [02 00] [00 f3] [02 f6] [ff]
         |             |          |       |       |     |
      zlbytes        zltail     zllen    "2"     "5"   end

   1. zlbytes: 一共占用15个字节
   2. zltail: 12个字节。从ziplist的起始位置开始数的12个字节
   3. zllen: 2，表示一共有两个entry
   4. 00 f3: 字符串2
   5. 02 f6: 字符串5
   6. ff: ziplist结尾
   */
  ```
