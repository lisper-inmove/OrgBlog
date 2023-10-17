#include <stdio.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>

int main() {
    struct sockaddr_un addr;
    int sfd;
    char buf[10];
    struct iovec iov[1];
    struct msghdr msg;
    struct cmsghdr *cmsg;
    int received_fd;
    char cmsgbuf[CMSG_SPACE(sizeof(received_fd))];

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

    // 连接到服务器
    if (connect(sfd, (struct sockaddr *) &addr, sizeof(struct sockaddr_un)) == -1) {
        perror("connect");
        exit(1);
    }

    // 设置消息结构体
    iov[0].iov_base = buf;
    iov[0].iov_len = sizeof(buf);

    memset(&msg, 0, sizeof(struct msghdr));
    msg.msg_iov = iov;
    msg.msg_iovlen = 1;
    msg.msg_control = cmsgbuf;
    msg.msg_controllen = sizeof(cmsgbuf);

    // 接收消息
    if (recvmsg(sfd, &msg, 0) == -1) {
        perror("recvmsg");
        exit(1);
    }

    // 获取控制消息中的文件描述符
    cmsg = CMSG_FIRSTHDR(&msg);
    if (cmsg == NULL || cmsg->cmsg_type != SCM_RIGHTS) {
        fprintf(stderr, "No SCM_RIGHTS received\n");
        exit(1);
    }

    /**
       received_fd的值，与发送端发送的值没有关系，接收进程的下一个可用fd
     */
    received_fd = *((int *) CMSG_DATA(cmsg));
    printf("Received file descriptor: %d\n", received_fd);
    printf("Received buf: %s\n", buf);

    char *buffer = "Hello World!";
    if (-1 == write(received_fd, buffer, strlen(buffer))) {
        perror(strerror(errno));
    }

    // 关闭套接字
    close(sfd);

    return 0;
}
