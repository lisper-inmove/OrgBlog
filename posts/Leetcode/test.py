from collections import deque
from typing import Optional

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Solution:

    def sumNumbers(self, root: Optional[TreeNode]) -> int:
        queue = deque()
        queue.append(root)
        value = 0
        guard = TreeNode(-1)
        while queue:
            cur = 0
            queue.append(guard)
            while queue:
                node = queue.popleft()
                if node == guard:
                    break
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
                cur += node.val
            value = value * 10 + cur
        return value


t0 = TreeNode(1)
t1 = TreeNode(2)
t2 = TreeNode(3)
t0.left = t1
t0.right = t2

Solution().sumNumbers(t0)
