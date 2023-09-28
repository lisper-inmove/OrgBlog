---
title: 整数集
date: 2023-09-11 21:08:37
summary:
keywords: Redis intset
prefix: Redis
---

# 整数集 (IntSet)
  整数集主要是用于优化小整数集合(整数数量少，并不是整数小)的存储。当一个集合只含有小量整数和时，使用IntSet能更加高效和操作这些整数。

  它内部维护了整数的有序性，所以查找使用二分查找是很快的。

## 结构体
  ```c
  typedef struct intset {
      uint32_t encoding;
      uint32_t length;
      // 实际使用时是转换成指针的
      int8_t contents[];
  } intset;
  ```

## 新增
  ```c
  static intset *intsetUpgradeAndAdd(intset *is, int64_t value) {
      /**

         如果新增的数字的 大小需要升级，则会调用此函数。
         比如，之前全是 int16的整数，新增的数字是 int32的，
         那么就需要整体进行一个升级

         intsetResize函数会调用realloc函数，重新分配内存空间。

       */
      uint8_t curenc = intrev32ifbe(is->encoding);
      uint8_t newenc = _intsetValueEncoding(value);
      int length = intrev32ifbe(is->length);
      int prepend = value < 0 ? 1 : 0;

      // 设置为新的编码方式
      is->encoding = intrev32ifbe(newenc);

      // 调用realloc扩容内存空间
      is = intsetResize(is,intrev32ifbe(is->length)+1);

      // 重新放置已有数据
      // 因为realloc只是在旧的内存空间中增加了一块给is使用
      // 所以旧的数据的存放位置，编码方式都没有变，所以使用旧的编码来获取原始数据
      while(length--)
          _intsetSet(is,length+prepend,_intsetGetEncoded(is,length,curenc));

      // 如果编码扩大了，那么新的数肯定不在原有数据范围内
      // 所以新的数要么话在最前面(小于0的时候)，要么放在最后面(大于0的时候)
      if (prepend)
          _intsetSet(is,0,value);
      else
          _intsetSet(is,intrev32ifbe(is->length),value);
      is->length = intrev32ifbe(intrev32ifbe(is->length)+1);
      return is;
  }


  /* Insert an integer in the intset */
  intset *intsetAdd(intset *is, int64_t value, uint8_t *success) {
      uint8_t valenc = _intsetValueEncoding(value);
      uint32_t pos;
      if (success) *success = 1;

      // 数据大小有增大
      if (valenc > intrev32ifbe(is->encoding)) {
          return intsetUpgradeAndAdd(is,value);
      } else {

          // 查找新的数字应该放的位置
          // 如果新的数字已经存在，直接返回，否则返回一个索引位置，存放在pos变量中
          if (intsetSearch(is,value,&pos)) {
              if (success) *success = 0;
              return is;
          }

          is = intsetResize(is,intrev32ifbe(is->length)+1);
          // 如果不是放在最后面，那么先为新的数字留下一个位置
          if (pos < intrev32ifbe(is->length)) intsetMoveTail(is,pos,pos+1);
      }

      // 实际就是，is.contents[pos] = value
      _intsetSet(is,pos,value);
      is->length = intrev32ifbe(intrev32ifbe(is->length)+1);
      return is;
  }
  ```

## 删除
  ```c
  static void intsetMoveTail(intset *is, uint32_t from, uint32_t to) {

"      /**

         整个 intset.c 中一共有两个地方调用了这个函数
         一个是 intsetAdd 另一个是 intsetRemove

         它的作用就是把内存空间整体进行一个移动，
         intsetAdd中用于为新的数字腾空间
         intsetRemove中则是用于填补删除的数字留下的洞

         以删除的时候为例

         . . . . . . 。. . . .

         其中'。'表示from的位置 from = 7, to = 6，
         表示把它后面的内存空间整体往前移，以填上删除的数字留下的洞

         新增的时候则是 from = 6, to = 7，类似这样。

       */


      void *src, *dst;
      // 要移动多少个数字
      uint32_t bytes = intrev32ifbe(is->length)-from;
      // 单个数字的编码
      uint32_t encoding = intrev32ifbe(is->encoding);

      if (encoding == INTSET_ENC_INT64) {
          // 源地址
          src = (int64_t*)is->contents+from;
          // 目的地
          dst = (int64_t*)is->contents+to;
          // 个数 * 单个的大小 = 总的字节数
          bytes *= sizeof(int64_t);
      } else if (encoding == INTSET_ENC_INT32) {
          src = (int32_t*)is->contents+from;
          dst = (int32_t*)is->contents+to;
          bytes *= sizeof(int32_t);
      } else {
          src = (int16_t*)is->contents+from;
          dst = (int16_t*)is->contents+to;
          bytes *= sizeof(int16_t);
      }
      memmove(dst,src,bytes);
  }


  intset *intsetRemove(intset *is, int64_t value, int *success) {
      uint8_t valenc = _intsetValueEncoding(value);
      uint32_t pos;
      if (success) *success = 0;

      // 找到要删除的数字的索引
      if (valenc <= intrev32ifbe(is->encoding) && intsetSearch(is,value,&pos)) {

          uint32_t len = intrev32ifbe(is->length);

          /* We know we can delete */
          if (success) *success = 1;

          // 删除了第i个数字，需要将 i + 1 到结尾的内存空间往前移动一个位置
          if (pos < (len-1)) intsetMoveTail(is,pos+1,pos);
          is = intsetResize(is,len-1);
          is->length = intrev32ifbe(len-1);
      }
      return is;
  }
  ```

## 查找
  ```c
  static uint8_t intsetSearch(intset *is, int64_t value, uint32_t *pos) {

      /**

         就是一个二分查找。稍微做了一下优化
         1. 如果本身就没有数字，那就不用找，返回位置0就行了
         2. 因为已有数据都是排好序的，先和首尾数字作比较，来判断，要查找的数字在不在集合中
         3. 最后用了一个二分查找来找到实际的数字

         这个函数其实有两个功能，一个是用于查找确定的数，
         另一个则是返回把一个索引位置保存在pos中

         这个pos有两个意思，
         1. 如果没找到，那么就是新的值可以插入的索引
         2. 如果有找到，那么就是 查找/删除 的索引

         得到索引就能做实际的工作了

       */

      int min = 0, max = intrev32ifbe(is->length)-1, mid = -1;
      int64_t cur = -1;

      /* The value can never be found when the set is empty */
      if (intrev32ifbe(is->length) == 0) {
          if (pos) *pos = 0;
          return 0;
      } else {
          /* Check for the case where we know we cannot find the value,
           * but do know the insert position. */
          if (value > _intsetGet(is,max)) {
              if (pos) *pos = intrev32ifbe(is->length);
              return 0;
          } else if (value < _intsetGet(is,0)) {
              if (pos) *pos = 0;
              return 0;
          }
      }

      while(max >= min) {
          mid = ((unsigned int)min + (unsigned int)max) >> 1;
          cur = _intsetGet(is,mid);
          if (value > cur) {
              min = mid+1;
          } else if (value < cur) {
              max = mid-1;
          } else {
              break;
          }
      }

      if (value == cur) {
          if (pos) *pos = mid;
          return 1;
      } else {
          if (pos) *pos = min;
          return 0;
      }
  }

  ```