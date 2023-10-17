#include <stdio.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>

int main() {
    int fd0 = open("test.txt", O_RDWR | O_CREAT);
    struct sockaddr_un addr;
    int sfd, cfd;
    char buf[10];
    struct iovec iov[1];
    /**
       struct msghdr {
           void *msg_name;              // 可选的地址
           socklen_t msg_namelen;       // 地址大小
           struct iovec *msg_iov;       // 数据块
           size_t msg_iovlen;           // 元素在msg_iov中的数量
           void *msg_control;           // 辅助数据
           size_t msg_controllen;       // 辅助数据长度
           int msg_flags;               // 接收到的消息标志
       }
     */
    struct msghdr msg;
    /**
       struct cmsghdr {
           size_t cmsg_len;            // 数据长度,包括头部
           int cmsg_level;             // 发起控制消息的协议
           int cmsg_type;              // 协议特定的类型
           unsigned char cmsg_data[];  // 表示控制消息的数据开始的地方。使用CMSG_DATA来获取这个指针
       }

       cmsg_level: 这个字段通常指定了哪个协议层应该解释控制消息
           SOL_SOCKET: 通用套接字层，用于处理与特定协议无关的控制消息
       cmsg_type: 这个字段的值取决于cmsg_level。它指定了控制消息的具体类型
       对于SOL_SOCKET层常见的有
           1. SCM_RIGHTS: 用于传递文件描述符
           2. SCM_CREDENTIALS: 用于传递进程凭据(PID, UID, GID)
           3. SCM_TIMESTAMP: 用于获取套接字接收数据的时间戳

     */
    struct cmsghdr *cmsg;
    /**
       确保控制消息的大小是size_t的整数倍，这样可以确保结构体的对齐。
       #define CMSG_SPACE(len) (sizeof(struct cmsghdr) + ((len) + sizeof(size_t) - 1) & ~(sizeof(size_t) - 1))
     */
    char cmsgbuf[CMSG_SPACE(sizeof(fd0))];

    // 创建UNIX域套接字
    sfd = socket(AF_UNIX, SOCK_STREAM, 0);
    if (sfd == -1) {
        perror("socket");
        exit(1);
    }

    // 设置套接字地址
    memset(&addr, 0, sizeof(struct sockaddr_un));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, "/tmp/fd-passing.sock", sizeof(addr.sun_path) - 1);

    // 绑定套接字到地址
    if (bind(sfd, (struct sockaddr *) &addr, sizeof(struct sockaddr_un)) == -1) {
        perror("bind");
        exit(1);
    }

    // 开始监听
    if (listen(sfd, 5) == -1) {
        perror("listen");
        exit(1);
    }

    // 接受连接
    cfd = accept(sfd, NULL, NULL);
    if (cfd == -1) {
        perror("accept");
        exit(1);
    }

    memset(buf, 'A', 10);
    // 设置消息结构体
    iov[0].iov_base = buf;
    iov[0].iov_len = sizeof(buf);

    memset(&msg, 0, sizeof(struct msghdr));
    msg.msg_iov = iov;
    msg.msg_iovlen = 1;
    msg.msg_control = cmsgbuf;
    msg.msg_controllen = sizeof(cmsgbuf);

    /**
       设置控制消息，用于传递文件描述符
       #define CMSG_FIRSTHDR(mhdr) \
           ((mhdr)->msg_controllen >= sizeof(struct cmsghdr) ? \
             (struct cmsghdr *)(mhdr)->msg_contrtol : \
             (struct cmsghdr *)NULL)
     */
    cmsg = CMSG_FIRSTHDR(&msg);
    cmsg->cmsg_level = SOL_SOCKET;
    cmsg->cmsg_type = SCM_RIGHTS;
    /**
       CMSG_LEN根据不同的系统有可能有不同的定义
       #define CMSG_LEN(len) (sizeof(struct cmsghdr) + (len))
     */
    cmsg->cmsg_len = CMSG_LEN(sizeof(fd0));
    /**
       实际上就是 cmsg_data字段
       #define CMSG_DATA(cmsg) ((unsigned char *)(cmsg) + sizeof(struct cmsghdr))
     */
    *((int *) CMSG_DATA(cmsg)) = fd0;

    // 发送消息
    if (sendmsg(cfd, &msg, 0) == -1) {
        perror("sendmsg");
        exit(1);
    }

    // 关闭套接字
    close(cfd);
    close(sfd);

    return 0;
}
