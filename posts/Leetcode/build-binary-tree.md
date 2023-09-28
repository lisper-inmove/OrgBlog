---
title: 构建二叉树
date: 2023-09-12 22:22:36
summary:
keywords: Leetcode BinaryTree
prefix: Leetcode
---

# 105. 从前序遍历与中序遍历序列构造二叉树
  ```python
  from typing import List, Optional

  class TreeNode:
      def __init__(self, val=0, left=None, right=None):
          self.val = val
          self.left = left
          self.right = right

  class Solution:
      def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
          if not inorder or not preorder:
              return None

          root = TreeNode(preorder[0])

          index = inorder.index(root.val)

          root.right = self.buildTree(preorder[index + 1:], inorder[index + 1:])
          root.left = self.buildTree(preorder[1:index + 1], inorder[:index])
          return root
  ```

  ```python
  from typing import List, Optional

  class TreeNode:
      def __init__(self, val=0, left=None, right=None):
          self.val = val
          self.left = left
          self.right = right

  class Solution:
      def buildTree(self, preorder: List[int], inorder: List[int]) -> Optional[TreeNode]:
          inmap = {v: index for index, v in enumerate(inorder)}
          def helper(pl, pr, il, ir):
              if pl > pr or il > ir:
                  return None
              root = TreeNode(preorder[pl])
              index = inmap.get(root.val)
              # 左子树的结点数量
              leftNodeCount = index - il
              root.right = helper(leftNodeCount + pl + 1, pr, index + 1, ir)
              root.left = helper(pl + 1, pl + leftNodeCount + 1, il, index - 1)
              return root
          return helper(0, len(preorder) - 1, 0, len(inorder) - 1)
  ```

# 106. 从中序与后序遍历序列构造二叉树
  ```python
  from typing import List, Optional

  class TreeNode:
      def __init__(self, val=0, left=None, right=None):
          self.val = val
          self.left = left
          self.right = right

  class Solution:
      def buildTree(self, inorder: List[int], postorder: List[int]) -> Optional[TreeNode]:
          if not inorder or not postorder:
              return None

          # 取出后序遍历的最后一个元素，即为当前的根节点
          root_val = postorder.pop()
          root = TreeNode(root_val)

          # 在中序遍历中找到根节点的位置
          index = inorder.index(root_val)

          # 先构建右子树，再构建左子树
          root.right = self.buildTree(inorder[index+1:], postorder)
          root.left = self.buildTree(inorder[:index], postorder)

          return root
  ```
