#include <stdio.h>
#include <setjmp.h>

#define TRY int count = setjmp(env); if (count == 0)

int main() {

}
