---
title: 跳跃表
date: 2023-09-11 21:09:12
summary:
keywords: Redis SkipList
prefix: Redis
---

# 跳跃表 (SkipList)

  常量定义
  ```c
  #define ZSKIPLIST_MAXLEVEL 32 /* Should be enough for 2^64 elements */
  #define ZSKIPLIST_P 0.25      /* Skiplist P = 1/4 */
  #define ZSKIPLIST_MAX_SEARCH 10
  ```

  数据结构定义
  ```c
  typedef struct zskiplistNode {
      sds ele;                             // 数据对象
      double score;                        // 节点分值，表中的所有节点都按照分值从小到大排序
      struct zskiplistNode *backward;      // 前驱结点，只有第0层有前驱结点
      struct zskiplistLevel {
          struct zskiplistNode *forward;   // 后驱结点
          unsigned long span;              // 当前结点到forward结点跨越的结点数
      } level[];                           // level[i]表示这个结点第i层存在
  } zskiplistNode;

  typedef struct zskiplist {
      struct zskiplistNode *header, *tail;  // 表头和表尾
      unsigned long length;                 // 结点总个数
      int level;                            // 当前最大层
  } zskiplist;
  ```

  创建与释放内存
  ```c
  zskiplistNode *zslCreateNode(int level, double score, sds ele) {
      zskiplistNode *zn = zmalloc(sizeod(*zn) + level * sizeof(struct zskiplistLevel));
      zn->score = score;
      zn-ele = ele;
      return zn;
  }

  zskiplist *zslCreate(void) {
      int j;
      zskiplist *zsl;

      zsl = zmalloc(sizeod(*zsl));
      zsl->level = 1;
      zsl->length = 0;
      zsl->header = zslCreateNode[ZSKIPLIST_MAXLEVEL, 0, NULL];
      for (j = 0; j < ZSKIPLIST_MAXLEVEL; j++) {
          zsl->header->level[j].forward = NULL;
          zsl->header->level[j].span = 0;
      }
      zsl->header->backward = NULL;
      zsl->tail = NULL;
      return zsl;
  }

  void zslFreeNode(zskiplistNode *node) {
      sdsfree(node->ele);
      zfree(node);
  }

  void zslFree(zskiplist *zsl) {
      zskiplistNode *node = zsl->header->level[0].forward, *next;
      zfree(zsl->header);
      while (node) {
          next = node->level[0].forward;
          zslFreeNode(node);
          node = next;
      }
      zfree(zsl);
  }
  ```

  为新建了Node返回一个随机层。返回值在[1 ~ ZSKIPLIST_MAXLEVEL]之间。根据批数定律，返回高层的可能性要低于返回低层的可能性。
  ```c
  int zslRandomLevel(void) {
      static const int threshold = ZSKIPLIST_P * RAND_MAX;
      int level = 1;
      while (random() < threshold)
          level += 1;
      return (level < ZSKIPLIST_MAXLEVEL) ? level : ZSKIPLIST_MAXLEVEL;
  }
  ```

## 插入结点
  ```c
  zskiplistNode *zslInsert(zskiplist *zsl, double score, sds ele) {
      // 存放新结点的前驱结点(backward)，同时也是最后一个比新增结点要小的结点
      zskiplistNode *update[ZSKIPLIST_MAXLEVEL], *x;
      // header到update[i] 的对应的结点的元素个数

      unsigned long rank[ZSKIPLIST_MAXLEVEL];
      int i, level;

      // 从最上层开始
      x = zsl->header;
      for (i = zsl->level - 1; i >= 0; i--) {
          rank[i] = i == (zsl->level - 1) ? 0 : rank[i + 1];

          # 寻找第i层上，新增结点的直接前驱(假设为x, 这个x是比score小的，但是x的当前后继要比score大)
          while(x->level[i].forward &&
                 // 后置结点的得分小于新增结点的得分
                (x->level[i].forward->score < score ||
                  // 或者后置结点的得分等于新增结点的得分，但是字符串比较来说，后置结点要小于新增结点
                 (x->level[i].forward->score == score &&
                  sdscmp(x->level[i].forward->ele, ele) < 0))) {
              rank[i] += x->level[i].span;
              x = x->level[i].forward;
          }

          // 这里保存的 新结点的直接前驱
          update[i] = x;
      }

      // 生成一个随机层
      level = zslRandomLevel();
      // 如果生成的随机层，比当前最大层数要大
      if (level > zsl->level) {
          // 为新增的层设置数据，其实就是扩大 header 的层数
          for (i = zsl->level; i < level; i++) {
              rank[i] = 0;
              update[i] = zsl->header;
              update[i]->level[i].span = zsl->length;
          }
          zsl->level = level;
      }

      // 创建新的结点
      x = zslCreateNode(level, score, ele);

      // 从第0层开始，摆放新结点的位置
      for (i = 0; i < level; i++) {
          // 新增结点，放在了 update[i] 和 update[i].forward之间
          x->level[i].forward = update[i]->level[i].forward;
          update[i]->level[i].forward = x;

          /*
          header        update[i]                    new              update[i].forward             tail
          | ----rank[i]--- | ---(rank[0] - rank[i])-- |
          | ---rank[0]------------------------------- |
                           | ---update[i]->level[i].span---------------------- |
          **/
          x->level[i].span = update[i]->level[i].span - (rank[0] - rank[i]);
          update[i]->level[i].span = (rank[0] - rank[i]) + 1;
      }

      // 没有新增的层的update[i]的跨越结点加1
      for (i = level; i < zsl->level; i++) {
          update[i]->level[i].span++;
      }

      // 设置新增结点的前驱结点
      x->backward = (update[0] == zsl->header) ? NULL : update[0];

      // 设置新增结点的后续结点的前驱结点
      if (x->level[0].forward)
          x->level[0].forward->backward = x;
      else:
          zsl->tail = x;
      zsl->length++;
      return x;
  }
  ```

## 删除结点
  ```c
  int zslDelete(zskiplist *zsl, double score, sds ele, zskiplistNode **node) {
      zskiplistNode *update[ZSKIPLIST_MAXLEVEL], *x;
      int i;

      // 找到要删除的结点在每一层上面的直接前驱
      x = zsl->header;
      for (i = zsl->level-1; i >= 0; i--) {
          while (x->level[i].forward &&
                  (x->level[i].forward->score < score ||
                      (x->level[i].forward->score == score &&
                       sdscmp(x->level[i].forward->ele,ele) < 0)))
          {
              x = x->level[i].forward;
          }
          update[i] = x;
      }
      // 因为有可能分值是相同的，所以还需要比较它的 字符串值是不是相同的
      // 因为x是待删除结点的直接前驱，所以删除的是它的 forward
      x = x->level[0].forward;
      if (x && score == x->score && sdscmp(x->ele,ele) == 0) {
          zslDeleteNode(zsl, x, update);
          if (!node)
              zslFreeNode(x);
          else
              *node = x;
          return 1;
      }
      return 0; /* not found */
  }

  void zslDeleteNode(zskiplist *zsl, zskiplistNode *x, zskiplistNode **update) {
      // update[i] 是每一层上，待删除结点的直接前驱
      int i;
      for (i = 0; i < zsl->level; i++) {
          // 如果update[i]是与x相连的，那么需要将x的后继过给update[i]
          if (update[i]->level[i].forward == x) {
              update[i]->level[i].span += x->level[i].span - 1;
              update[i]->level[i].forward = x->level[i].forward;
          } else {
          // 否则，x可能不在这一层上面，只需要，将这个前驱的span减1就行了
              update[i]->level[i].span -= 1;
          }
      }
      if (x->level[0].forward) {
          x->level[0].forward->backward = x->backward;
      } else {
          zsl->tail = x->backward;
      }
      while(zsl->level > 1 && zsl->header->level[zsl->level - 1].forward == NULL)
          zsl->level--;
      zsl->length--;
  }
  ```
## 更新score字段
  ```c

  zskiplistNode *zslUpdateScore(zskiplist *zsl, double curscore, sds ele, double newscore) {
      zskiplistNode *update[ZSKIPLIST_MAXLEVEL], *x;
      int i;

      x = zsl->header;
      for (i = zsl->level-1; i >= 0; i--) {
          while (x->level[i].forward &&
                  (x->level[i].forward->score < curscore ||
                      (x->level[i].forward->score == curscore &&
                       sdscmp(x->level[i].forward->ele,ele) < 0)))
          {
              x = x->level[i].forward;
          }
          update[i] = x;
      }

      x = x->level[0].forward;
      serverAssert(x && curscore == x->score && sdscmp(x->ele,ele) == 0);

      // 以下两个条件同时满足时，直接更新score
      // 没有前驱结点(也就是直接与header连接的结点)。或者前驱结点的值要比newscore要小
      // 并且没有后继(也就是直接与tail连接的结点)。或者后继的结点的值要比newscore要大
      if ((x->backward == NULL || x->backward->score < newscore) &&
          (x->level[0].forward == NULL || x->level[0].forward->score > newscore))
      {
          x->score = newscore;
          return x;
      }

      // 否则，先删除再新增
      zslDeleteNode(zsl, x, update);
      zskiplistNode *newnode = zslInsert(zsl,newscore,x->ele);

      x->ele = NULL;
      zslFreeNode(x);
      return newnode;
  }
  ```
