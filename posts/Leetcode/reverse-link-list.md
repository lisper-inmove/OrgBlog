---
title: 反转链表
date: 2023-09-03 21:55:52
keywords: Leetcode LinkList
prefix: Leetcode
---

# 206. 反转链表
  ```python
  from typing import Optional

  class ListNode:
      def __init__(self, val=0, next=None):
          self.val = val
          self.next = next

  class Solution:
      def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
          if head is None:
              return None
          slower, faster = head, head.next
          prev = None
          while faster:
              slower.next = prev
              prev = faster.next
              faster.next = slower
              slower = faster
              faster = prev
              prev = slower.next
          return slower
  ```
# 92. 反转链表II
  ```python
  from typing import Optional

  class ListNode:
      def __init__(self, val=0, next=None):
          self.val = val
          self.next = next

  class Solution:
      def reverseBetween(self, head: Optional[ListNode], left: int, right: int) -> Optional[ListNode]:
          dummy = ListNode()
          dummy.next = head
          prev = dummy
          for i in range(0, left - 1):
              prev = prev.next
          cur = prev.next
          for i in range(0, right - left):
              n = cur.next
              cur.next = n.next
              n.next = prev.next
              prev.next = n
          return dummy.next
  ```


# 25. K个一组反转链表
  ```python
  from typing import Optional

  class ListNode:
      def __init__(self, val=0, next=None):
          self.val = val
          self.next = next


  class Solution:

      def reverseKGroup(self, head: Optional[ListNode], k: int) -> Optional[ListNode]:
          if k == 1:
              return head
          dummy = ListNode()
          dummy.next = head
          prev = dummy
          end = dummy
          while True:
              end = self.find_end(end, k)
              if end is None:
                  break
              prev = self.reverse(prev, end)
              end = prev
          return dummy.next

      def reverse(self, prev, end):
          start = prev.next
          p = prev.next
          end_node = end.next
          while True:
              n = start.next
              start.next = n.next
              n.next = p
              p = n
              if start.next == end_node:
                  break
          prev.next = p
          return start

      def find_end(self, node, k):
          while k and node:
              node = node.next
              k -= 1
          return node

  ```
