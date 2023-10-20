#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

typedef struct {
    int id;
    char name[256];
} Person;

int main() {
    int fd[2];
    pid_t pid;
    Person p_send = {1, "Inmove"};
    Person p_recv;

    // 创建管道
    if (pipe(fd) < 0) {
        perror("pipe error");
        exit(1);
    }

    // 创建子进程
    pid = fork();
    if (pid < 0) {
        perror("fork error");
        exit(1);
    }

    if (pid > 0) {  // 父进程
        close(fd[0]);  // 关闭读端
        // 将结构体写入管道
        write(fd[1], &p_send, sizeof(Person));
        close(fd[1]);  // 关闭写端
    } else {  // 子进程
        close(fd[1]);  // 关闭写端
        // 从管道中读取结构体
        read(fd[0], &p_recv, sizeof(Person));
        printf("Received Person: id=%d, name=%s\n", p_recv.id, p_recv.name);
        close(fd[0]);  // 关闭读端
    }

    return 0;
}
