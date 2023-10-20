#define _GNU_SOURCE

#include <dlfcn.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <link.h>

typedef void* (*malloc_t)(size_t size);
typedef void (*free_t)(void *);

malloc_t malloc_f = NULL;
free_t free_f = NULL;

void* converToELF(void *addr) {
     Dl_info info;
     struct link_map *link;
     dladdr1(addr, &info, (void **)&link, RTLD_DL_LINKMAP);

     // elf地址 = 用户程序的地址 - 基地址
     return (void *)((size_t)addr - link->l_addr);
 }

// 在malloc函数中有可能再调用malloc，比如printf函数
// 这个变量的作用只是为了阻止malloc函数的无限递归
int enable_malloc_hook = 1;

void *malloc(size_t size) {
    void *p  = NULL;
    if (enable_malloc_hook) {
        enable_malloc_hook = 0;
        printf("Call Malloc\n");
        p = malloc_f(size);

        char filename[128] = {0};
        sprintf(filename, "./mem/%p.mem", p);
        FILE *fp = fopen(filename, "w");
        // 0表示返回上一级函数
        // 1表示返回上两级函数
        void *caller = __builtin_return_address(0);
        fprintf(fp, "[+]caller: %p, addr: %p, size: %ld\n", converToELF(caller), p, size);
        fflush(fp);
        enable_malloc_hook = 1;
    } else {
        p = malloc_f(size);
    }
    return p;
}

int enable_free_hook = 1;
void free(void *p) {
    if (enable_free_hook) {
        printf("Call Free\n");
        enable_free_hook = 0;
        char buff[128] = {0};
        sprintf(buff, "./mem/%p.mem", p);
        if (unlink(buff) < 0) {
            printf("double free: %p\n", p);
            return;
        }
        free_f(p);
        enable_free_hook = 1;
    } else {
        free_f(p);
    }
}

void init_hook(void) {
    if (!malloc_f)
        malloc_f = dlsym(RTLD_NEXT, "malloc");
    if (!free_f)
        free_f = dlsym(RTLD_NEXT, "free");
}


int main() {

    init_hook();

    void *p1 = malloc(32);
    void *p2 = malloc(32);

    free(p1);

    return 0;
}
