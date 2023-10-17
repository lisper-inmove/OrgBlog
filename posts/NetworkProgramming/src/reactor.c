#include <stdio.h>
#include <errno.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <fcntl.h>
#include <sys/epoll.h>

#define MAX_PORT          100      // listenfd 的总个数
#define EVENT_LENGTH      1024     // 单个block块容纳的事件个数
#define BUFFER_LENGTH     4096     // 读写缓存区的大小

typedef int (*EVENT_CB)(int fd, int events, void *arg);

int conn_count = 0;

/**

   reactor ------>  blockheader  ------------------> block1 ---------------> block2 ----> NULL
   1. blkcnt=3          |
                        v
                   |-----events-----|
                   +                +
                   + connect_t      +
                   + connect_t      +
                   + ...            +
                   + EVENT_LENGTH   +
                   +                +
                   |----------------|

 */

typedef struct connect_s {
    int fd;
    EVENT_CB cb;
    char rbuffer[BUFFER_LENGTH];
    int rc;
    char wbuffer[BUFFER_LENGTH];
    int wc;
    int count;                        // 单次 可读/写的最大字符数
} connect_t;

typedef struct connblock_s {
    connect_t *block;
    struct connblock_s *next;
} connblock_t;

typedef struct reactor_s {
    int epfd;
    int blkcnt;
    connblock_t *blockheader;
} reactor_t;


int recv_cb(int fd, int event, void *arg);
int send_cb(int fd, int event, void *arg);
int accept_cb(int fd, int event, void *arg);
connect_t* connect_idx(reactor_t *reactor, int fd);
int add_block(reactor_t *reactor);

static int make_socket_non_blocking(int sfd) {
    int flags, s;

    flags = fcntl(sfd, F_GETFL, 0);
    if (flags == -1) {
        perror("fcntl F_GETFL");
        return -1;
    }
    flags |= O_NONBLOCK;
    s = fcntl(sfd, F_SETFL, flags);

    if (s == -1) {
        perror("fcntl F_SETFL");
        return -1;
    }
    return 0;
}

int init_reactor(reactor_t *reactor) {
    /**
       初始化reactor
       初始化blockheader
       创建epoll
     */
    if (!reactor) return -1;
    add_block(reactor);
    reactor->epfd = epoll_create1(0);
    printf("Init reactor: %d\n", reactor->epfd);
    perror(strerror(errno));
}

int init_server(short port) {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);

    struct sockaddr_in servaddr;
    memset(&servaddr, 0, sizeof(struct sockaddr_in));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = htonl(INADDR_ANY);
    servaddr.sin_port = htons(port);

    int optval = 1;
    if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &optval, sizeof(optval)) == -1) {
        perror("Setsockopt");
        return -1;
    }

    if (-1 == bind(sockfd, (struct sockaddr *)&servaddr, sizeof(struct sockaddr))) {
        printf("Bind Failed: %s", strerror(errno));
        return -1;
    }

    make_socket_non_blocking(sockfd);

    listen(sockfd, EVENT_LENGTH);
    printf("listen at: %d, %d\n", port, sockfd);
    return sockfd;
}

int set_listener(reactor_t *reactor, int fd, EVENT_CB cb) {
    if (!reactor || !reactor->blockheader) return -1;
    connect_t *conn = connect_idx(reactor, fd);
    conn->fd = fd;
    conn->cb = cb;
    struct epoll_event ev;
    ev.events = EPOLLIN;
    ev.data.fd = fd;
    epoll_ctl(reactor->epfd, EPOLL_CTL_ADD, fd, &ev);
    // printf("SetListener %d, %d, %s\n", reactor->epfd, fd, strerror(errno));
}

int accept_cb(int fd, int events, void *arg) {
    struct sockaddr_in clientaddr;
    socklen_t len = sizeof(clientaddr);
    int clientfd = accept(fd, (struct sockaddr *)&clientaddr, &len);
    if (clientfd < 0) {
        printf("Accept errno: %d\n", errno);
        return -1;
    }

    reactor_t *reactor = (reactor_t *)arg;
    connect_t *conn = connect_idx(reactor, clientfd);

    conn->fd = clientfd;
    conn->cb = recv_cb;
    conn->count = BUFFER_LENGTH;

    struct epoll_event ev;
    ev.events = EPOLLIN;
    ev.data.fd = clientfd;
    epoll_ctl(reactor->epfd, EPOLL_CTL_ADD, clientfd, &ev);

    conn_count++;
    if (conn_count % 1000 == 0) {
        printf("accept new client: %d, total connection: %d\n", clientfd, conn_count);
    }

    make_socket_non_blocking(fd);
    return 0;
}

void wclose(reactor_t *reactor, connect_t *conn, int fd) {
    conn->fd = -1;
    conn->rc = 0;
    conn->wc = 0;
    epoll_ctl(reactor->epfd, EPOLL_CTL_DEL, fd, NULL);
    close(fd);
    conn_count--;
}

int recv_cb(int fd, int events, void *arg) {
    reactor_t *reactor = (reactor_t *)arg;
    connect_t *conn = connect_idx(reactor, fd);

    int ret = recv(fd, conn->rbuffer + conn->rc, conn->count, 0);

    if (ret < 0) {  // 没有数据可读

    } else if (ret == 0) {  // 对端关闭
        wclose(reactor, conn, fd);
        return -1;
    }
    conn->rc += ret;
    memcpy(conn->wbuffer, conn->rbuffer, conn->rc);
    conn->wc = conn->rc;
    conn->rc = 0;
    conn->cb = send_cb;
    struct epoll_event ev;
    ev.events = EPOLLOUT;
    ev.data.fd = fd;
    epoll_ctl(reactor->epfd, EPOLL_CTL_MOD, fd, &ev);

    // printf("Recv data from client: %d, %s\n", conn->fd, conn->wbuffer);
    return 0;
}

int send_cb(int fd, int events, void *arg) {
    reactor_t *reactor = (reactor_t *)arg;
    connect_t *conn = connect_idx(reactor, fd);

    int ret = send(fd, conn->wbuffer, conn->wc, 0);
    if (ret == -1) {
        wclose(reactor, conn, fd);
        return -1;
    }
    // printf("Send data to client: %d, %s\n", conn->fd, conn->wbuffer);

    conn->cb = recv_cb;

    struct epoll_event ev;
    ev.events = EPOLLIN;
    ev.data.fd = fd;
    epoll_ctl(reactor->epfd, EPOLL_CTL_MOD, fd, &ev);
    return 0;
}

int add_block(reactor_t *reactor) {
    /**
       在尾部插入一块新的block
     */
    if (!reactor) return -1;
    connblock_t *connblock = malloc(sizeof(connblock_t) + EVENT_LENGTH * sizeof(connect_t));
    connblock_t *blk = reactor->blockheader;
    if (connblock == NULL) return -1;
    connblock->block = (connect_t *)(connblock + 1);
    connblock->next = NULL;
    if (!reactor->blockheader) {
        reactor->blockheader = connblock;
        reactor->blockheader->block = (connect_t *)(connblock + 1);
    } else {
        // 找到最后一块
        while (blk->next != NULL) blk = blk->next;
        blk->next = connblock;
    }
    reactor->blkcnt++;
    return 0;
}

connect_t* connect_idx(reactor_t *reactor, int fd) {
    /**
       先找到block块，再找到block块中的event
       fd / EVENT_LENGTH 得到位于哪一块
       fd % EVENT_LENGTH 得到位于该块的哪一个索引
     */
    if (!reactor) return NULL;
    int blkidx = fd / EVENT_LENGTH;

    // 如果现有block块不能容纳新的fd，则需要在尾部添加新的block块
    while (blkidx >= reactor->blkcnt) {
        add_block(reactor);
    }

    // 将指针指向fd应该存在的block
    int i = 0;
    connblock_t *blk = reactor->blockheader;
    while (i++ < blkidx) {
        blk = blk->next;
    }

    connect_t *conn = &blk->block[fd % EVENT_LENGTH];
    return conn;
}

int main(int argc, char *argv[]) {
    int port = 19999;
    // 一共在MAX_PORT端口上监听。这些端口都可以accept新的连接
    int sockfds[MAX_PORT] = {0};

    reactor_t reactor;
    init_reactor(&reactor);

    int i = 0;
    for (i = 0; i < MAX_PORT; i++) {
        int sockfd = init_server(port + i);
        set_listener(&reactor, sockfd, accept_cb);
    }

    struct epoll_event events[EVENT_LENGTH] = {0};
    while (1) {
        int nready = epoll_wait(reactor.epfd, events, EVENT_LENGTH, 1000);
        // printf("epoll wait: %d, %d\n", nready, reactor.epfd);
        int i = 0;
        for (i = 0; i < nready; i++) {
            int connfd = events[i].data.fd;
            connect_t *conn = connect_idx(&reactor, connfd);
            conn->cb(connfd, events[i].events, &reactor);
        }
    }

    return 0;
}
