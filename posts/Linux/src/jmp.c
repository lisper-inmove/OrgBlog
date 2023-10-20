#include <stdio.h>
#include <setjmp.h>

jmp_buf env1;

void func(int idx) {
    printf("func --> idx: %d\n", idx);
    /**
       当前函数被调用时，func在栈顶，longjmp被调用时，pc跳以了setjmp(env)的位置
       下一个函数被调用时，原本func的栈的位置就被覆盖了。
     */
    longjmp(env1, idx);
}

int main() {
    int count = setjmp(env1);
    if (count == 0) {
        printf("count --> %d\n", count);
        func(++count);
    } else if (count == 1) {
        printf("count --> %d\n", count);
        func(++count);
    } else if (count == 2) {
        printf("count --> %d\n", count);
        func(++count);
    } else if (count == 3) {
        printf("count --> %d\n", count);
        func(++count);
    }

    printf("finally count: %d\n", count);
    return 0;
}
