---
title: Git
date: 2023-08-27 20:08:31
keywords: Git
summary: Git常见的问题
---

# 使用http的方式的时候保存用户名与密码

  运行以下命令之后,git会保存你输入的username和password。

  下一次再push/pull等需要账户密码的命令时会让你输入密码，再之后就不再需要输入密码了

  会在 *~/.git-credentials* 以明文的方式保存你的账号密码。所以请确保此服务器上的用户只有你一个人在使用

  ```shell
  git config --global credential.helper store
  ```
# 合并forked仓库

  仓库A为原始仓库，B为从A fork过来的仓库

  在B仓库中操作
  1. git remote -v: 查看远端分支。尽管是从A fork过来的仓库但是在这里并不会看到A
  2. git remote add upstream A: 把A作为上游添加到B
  3. git remote -v: 这时就能看到A了
  4. git merge upstream/A: 合并A到B
  5. git push origin B: 把B推到仓库
