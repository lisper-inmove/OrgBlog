---
title: LCP 47. 二叉树剪枝
date: 2023-08-30 21:48:43
keywords: Leetcode BinaryTree
prefix: Leetcode
---

# Solution
  ```python
  class TreeNode:
      def __init__(self, val=0, left=None, right=None):
          self.val = val
          self.left = left
          self.right = right

  class Solution:
      def pruneTree(self, root: TreeNode) -> TreeNode:
          flag = self.prune(root)
          if flag:
              return None
          return root

      def prune(self, node):
          if node is None:
              return True
          lprune = self.prune(node.left)
          rprune = self.prune(node.right)
          if lprune and rprune and node.val == 0:
              return True
          if lprune:
              node.left = None
          if rprune:
              node.right = None
          return False

  ```
