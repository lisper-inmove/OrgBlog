typedef struct spinlock spinlock_t;

typedef struct task_s {
    void *next;
    handler_pt func;
    void *arg;
} task_t;

typedef struct task_queue_s {
    void *head;
    void **tail;
    int block;
    spinlock_t lock;
    pthread_mutex_t mutex;
    pthread_cond_t cond;
} task_queue_t;

struct thrdpool_s {
    task_queue_t *task_queue;
    atomic_int quit;
    int thrd_count;
    pthread_t *threads;
};

static task_queue_t * __taskqueue_create() {

    task_queue_t *queue = (task_queue_t *)malloc(sizeof(task_queue_t));
    if (!queue) return NULL;

    int ret;
    ret = pthread_mutex_init(&queue->mutex, NULL);
    if (ret == 0) {
        ret = pthread_cond_init(&queue->cond, NULL);
        if (ret == 0) {
            spinlock_init(&queue->lock);
            queue->head = NULL;
            queue->tail = &queue->head;
            queue->block = 1;
            return queue;
        }
        pthread_cond_destroy(&queue->cond);
    }
    pthread_mutex_destory(&queue->mutex);

    return NULL;
}

static void __nonblock(task_queue_t *queue) {
    pthread_mutex_lock(&queue->mutex);
    queue->block = 0;
    pthread_mutex_unlock(&queue->mutex);
    pthread_cond_broadcast(&queue->cond);
}
