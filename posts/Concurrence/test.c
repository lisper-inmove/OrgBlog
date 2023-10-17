#include <stdio.h>
#include <stdlib.h>

/**

   栈

                                                                                          这是一个变量
   +---------------+                                                                   +-------------------------------+
   |arr  | array   |   将h传给了函数，所以arr的值也是指向 array的地址的。              |地址| 值(可能会是一个地址)     |
   +---------------+   *arr 叫解引用，相当于顺着 arr的值找到那个变量                   +-------------------------------+

         ^
         |

   +---------------+
   | h   | array   |   在栈上定义了另一个指针变量，名称为h，值为array的地址
   +---------------+

         ^
         |

   +---------------+
   |array| NULL    |   在栈上定义了一个指针变量，名称为array，值为NULL
   +---------------+


 */

void allocateArray(int **arr, int size) {
    printf("%p\n", &(*arr));  // 输出同 &array
    *arr = malloc(size * sizeof(int));
}

int main() {
    int *array = NULL;
    int **h = &array;
    printf("%p\n", &array);
    printf("%p\n", &h);
    printf("%p\n", &(*h));
    allocateArray(h, 5);
    free(array);
    return 0;
}
