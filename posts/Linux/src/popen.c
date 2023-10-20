#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    FILE *fp;
    char buffer[256];

    // 使用 popen() 创建一个管道并执行 "ls" 命令
    if ((fp = popen("ls", "r")) == NULL) {
        perror("popen error");
        exit(1);
    }

    // 读取 "ls" 命令的输出
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("%s", buffer);
    }

    // 使用 pclose() 关闭管道
    if (pclose(fp) == -1) {
        perror("pclose error");
        exit(1);
    }

    return 0;
}
