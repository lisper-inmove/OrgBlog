#include <stdio.h>
#include <stdlib.h>


// 每次分配4k大小的内存
#define MEM_PAGE_SIZE		0x1000


typedef struct mempool_s {
    // 一块内存的大小
    int block_size;
    // 还有多少块内存是空闲要的
    int free_count;

    // 下一块可分配的内存首地址
    char *free_ptr;
    // 内存的首地址(malloc的返回值)
    char *mem;
} mempool_t;


int pool_init(mempool_t *m, int block_size) {

    if (!m) return -2;

    m->block_size = block_size;
    m->free_count = MEM_PAGE_SIZE / block_size;

    m->free_ptr = (char *)malloc(MEM_PAGE_SIZE);
    if (!m->free_ptr) return -1;
    m->mem = m->free_ptr;

    int i = 0;
    char *ptr = m->free_ptr;
    for (i = 0;i < m->free_count;i ++) {

        /**


           +---------------------------+
           | ptr | value(free_ptr)     |          char *ptr = m->free_ptr;                                                            +-----------------------+
           +---------------------------+          ptr 是一个变量，指向的是栈中的一个地址。                                            | free_ptr | char       |
                                                  它的值是一个地址。它的值所指向的地址的值 是一个char类型的变量(char *free_ptr)       +-----------------------+

                                          *(char **)ptr = ptr + block_size 这里其实是在给x赋值
                                             |
                                             v
           +-----------------+             +------------------+
           | ptr | value    -+-----------> | x | value        |          (char **)ptr 将ptr强转成二级指针，它的值所指向的地址就是一个拥有8个字节的地址了
           +-----------------+             +------------------+          *(char **)ptr 则是将其解引用，也就是得到了 ptr的value 所指向的地址了。它可以当做左值来使用。

           ptr是一个变量，它的值是一个地址。(char **)ptr 将ptr强转成二级指针
           最前面的*表示解引用，所以 *(char **)ptr 指向了x。相当于是一个变量了，所以可以做为左值使用。
         */
        *(char **)ptr = ptr + block_size;
        ptr += block_size;

    }
    *(char **)ptr = NULL;

    return 0;
}


void *pool_alloc(mempool_t *m) {

    if (!m || m->free_count == 0) return NULL;

    void *ptr = m->free_ptr;

    m->free_ptr = *(char **)ptr;
    m->free_count --;

    return ptr;
}

void *pool_free(mempool_t *m, void *ptr) {

    *(char**)ptr = m->free_ptr;
    m->free_ptr = (char *)ptr;
    m->free_count ++;

}


int main() {

    mempool_t m;

    pool_init(&m, 32);
    printf("pool address: %p\n", m.mem);

    void *p1 = pool_alloc(&m);
    *(char *)p1 = 'c';
    printf("pool_alloc p1: %p, %c\n", p1, *(char *)p1);

    void *p2 = pool_alloc(&m);
    printf("pool_alloc p2: %p\n", p2);

    void *p3 = pool_alloc(&m);
    printf("pool_alloc p3: %p\n", p3);

    void *p4 = pool_alloc(&m);
    printf("pool_alloc p4: %p\n", p4);

    pool_free(&m, p1);
    pool_free(&m, p3);

    void *p5 = pool_alloc(&m);
    printf("pool_alloc p5 : %p\n", p5);

    void *p6 = pool_alloc(&m);
    printf("pool_alloc p6 : %p\n", p6);

}
