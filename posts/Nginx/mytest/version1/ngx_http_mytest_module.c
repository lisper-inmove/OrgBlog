#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>


static char *
ngx_http_mytest(ngx_conf_t *cf, ngx_command_t *cmd, void *conf);

static ngx_int_t ngx_http_mytest_handler(ngx_http_request_t *r);



static ngx_command_t  ngx_http_mytest_commands[] = {

    /*
      typedef struct ngx_command_s ngx_command_t;

      struct ngx_command_s {
          ngx_str_t name;
          // 配置项类型。指定配置项可以出现的位置。如server或者location。以及它们可以带的参数的个数
          ngx_uint_t type;

          // 出现了name指定的配置项后，将会调用set方法处理配置项的参数
          char *(*set)(ngx_conf_t cf, ngx_command_t cmd, void *conf);

          ngx_uint_t conf;
          ngx_uint_t offset;

          // 配置项读取后的处理方法。必须是ngx_conf_post_t的结构体指针
          void *post;
      };

      // ngx_null_command 只是一个空的ngx_command_t;
      #define ngx_null_command { ngx_null_string, 0, NULL, 0, 0, NULL };
     */

    {
        ngx_string("mytest"),
        NGX_HTTP_MAIN_CONF | NGX_HTTP_SRV_CONF | NGX_HTTP_LOC_CONF | NGX_HTTP_LMT_CONF | NGX_CONF_NOARGS,
        ngx_http_mytest,
        NGX_HTTP_LOC_CONF_OFFSET,
        0,
        NULL
    },

    ngx_null_command
};


/*
typedef struct {

    // 解析配置文件解析前调用
    ngx_int_t (*preconfiguration)(ngx_conf_t *cf);

    // 解析配置文件后调用
    ngx_int_t (*postconfiguration)(ngx_conf_t *cf);

    // 当需要创建DataStructure用于存储main级别的全局配置项时，
    // 可以以过create_main_conf回调方法创建存储全局配置荐的结构体
    void *(*create_main_conf)(ngx_conf_t *cf);

    // 用于初始化main级别配置项
    char *(*init_main_conf)(ngx_conf_t cf, void conf);

    void *(*create_srv_conf)(ngx_conf_t *cf);

    // 合并main下和srv下的同名conf
    void *(*merge_srv_conf)(ngx_conf_t cf, void prev, void *conf);

    void *(*create_loc_conf)(ngx_conf_t *cf);
    // 合并srv和loc下的同名配置项
    void *(*merge_loc_conf)(ngx_conf_t cf, void prev, void *conf);
} ngx_http_module_t;
 */
static ngx_http_module_t  ngx_http_mytest_module_ctx = {
    NULL,                              /* preconfiguration */
    NULL,                  		       /* postconfiguration */

    NULL,                              /* create main configuration */
    NULL,                              /* init main configuration */

    NULL,                              /* create server configuration */
    NULL,                              /* merge server configuration */

    NULL,       			           /* create location configuration */
    NULL         			           /* merge location configuration */
};

/*
  typedef struct ngx_module_s ngx_module_t;

  struct ngx_module_s {

      // 下面的 ctx_index, index, spare0, spare1, spare2, spare3 version 变量不需要在定义时赋值
      // 可以用Nginx准备好的宏NGX_MODULE_V1来定义,它已经定义好了这7个值

      // #define NGX_MODULE_V1 0, 0, 0, 0, 0, 0, 1
      // 对于一类模块(由下面的type成员决定类型)而言
      // ctx_index表示当前模块在这类模块中的序号。
      // 这个成员常常是由管理这类模块的一个Nginx核心模块设置的，
      // 对于所有的HTTP模块而言，ctx_index是由核心模块ngx_http_module设置的。
      // ctx_index非常重要，Nginx的模块化设计非常依赖于各个模块的顺序，
      // 它们既用于表达优先级，也用于表明每个模块的位置，借以帮助Nginx框架快速获得某个模块的数据
      ngx_uint_t ctx_index;

      // index表示当前模块在ngx_modules数组中的序号。注意，ctx_index表示的是当前模块在一类模块中的序号。
      // 而index表示的是当前模块在所有模块中的序号，它同样关键。
      // Nginx启动时会根据ngx_modules数组设置各模块的index值。
      ngx_uint_t index;
      ngx_uint_t spare0;
      ngx_uint_t spare1;
      ngx_uint_t spare2;
      ngx_uint_t spare3;

      // ngx_uint_t version;

     // *ctx用于指向一类模块的上下文结构体。
     // 根据不同的类型的模块，指向不同的模块结构体。
     // 如HTTP，指向的是一个ngx_http_module_t结构体
     void *ctx;

     // 可用于nginx中的配置项
     ngx_command_t *commands;

     // type 表示该模块的类型，它与ctx紧密相关
     // 1. NGX_HTTP_MODULE
     // 2. NGX_CORE_MODULE
     // 3. NGX_CONF_MODULE
     // 4. NGX_EVENT_MODULE
     // 5. NGX_MAIL_MODULE
     // 6. 也可以自定义模块
     ngx_uint_t type;

     // master进程启动时回调
     ngx_int_t (*init_master)(ngx_log_t *log);

     // master/worker模式下，这个阶段将在启动worker子进程前完成
     ngx_int_t (*init_module)(ngx_cycle_t *cycle);

     // 在master/worker模式下，多个worker子进程已经产生，
     // 在每个worker进程的初始化进程会调用所有模块的init_process函数
     ngx_int_t (*init_process)(ngx_cycle_t *cycle);

     ngx_int_t (*init_thread)(ngx_cycle_t *cycle);
     void (*exit_thread)(ngx_cycle_t *cycle);
     // worker进程会在退出前调用它
     void (*exit_process)(ngx_cycle_t *cycle);

     // 在master退出前调用
     void (*exit_master)(ngx_cycle_t *cycle);

     // 以下8个暂也没有用上
     // 可以由 #define NGX_MODULE_V1_PADDING 0, 0, 0, 0, 0, 0, 0, 0, 来填充
     uintptr_t spare_hook0;
     uintptr_t spare_hook1;
     uintptr_t spare_hook2;
     uintptr_t spare_hook3;
     uintptr_t spare_hook4;
     uintptr_t spare_hook5;
     uintptr_t spare_hook6;
     uintptr_t spare_hook7;
 }
 */
ngx_module_t  ngx_http_mytest_module =
{
    NGX_MODULE_V1,
    &ngx_http_mytest_module_ctx,           /* module context */
    ngx_http_mytest_commands,              /* module directives */
    // 因为我们定义的是 HTTP模块，所以使用 NGX_HTTP_MODULE
    NGX_HTTP_MODULE,                       /* module type */
    NULL,                                  /* init master */
    NULL,                                  /* init module */
    NULL,                                  /* init process */
    NULL,                                  /* init thread */
    NULL,                                  /* exit thread */
    NULL,                                  /* exit process */
    NULL,                                  /* exit master */
    NGX_MODULE_V1_PADDING
};

static char *
ngx_http_mytest(ngx_conf_t *cf, ngx_command_t *cmd, void *conf) {
    ngx_http_core_loc_conf_t  *clcf;

    /*
      首先找到mytest配置项所属的配置块，clcf貌似是location块内的数据
      结构，其实不然，它可以是main、srv或者loc级别配置项，也就是说在每个
      http{}和server{}内也都有一个ngx_http_core_loc_conf_t结构体
    */
    clcf = ngx_http_conf_get_module_loc_conf(cf, ngx_http_core_module);

    /*
      http框架在处理用户请求进行到NGX_HTTP_CONTENT_PHASE阶段时，如果
      请求的主机域名、URI与mytest配置项所在的配置块相匹配，就将调用我们
      实现的ngx_http_mytest_handler方法处理这个请求
    */
    clcf->handler = ngx_http_mytest_handler;

    return NGX_CONF_OK;
}


/*
  ngx_http_request_t 的定义在 src/http/ngx_http_request.h 文件中
  它的成员变量决定了，如何获取请求方法，请求参数，以及headers
 */
static ngx_int_t ngx_http_mytest_handler(ngx_http_request_t *r)
{
    // 必须是GET或者HEAD方法，否则返回405 Not Allowed
    if (!(r->method & (NGX_HTTP_GET | NGX_HTTP_HEAD)))
    {
        return NGX_HTTP_NOT_ALLOWED;
    }

    // 丢弃请求中的包体
    ngx_int_t rc = ngx_http_discard_request_body(r);
    if (rc != NGX_OK)
    {
        return rc;
    }

    // 设置返回的Content-Type。ngx_string可以设置好 len 与 data成员
    ngx_str_t type = ngx_string("text/plain");
    // 返回的包体内容
    ngx_str_t response = ngx_string("Hello World!");
    // 设置返回状态码
    r->headers_out.status = NGX_HTTP_OK;
    // 响应包是有包体内容的，所以需要设置Content-Length长度
    r->headers_out.content_length_n = response.len;
    // 设置Content-Type
    r->headers_out.content_type = type;

    // 发送http头部
    rc = ngx_http_send_header(r);
    if (rc == NGX_ERROR || rc > NGX_OK || r->header_only)
    {
        return rc;
    }

    // 构造ngx_buf_t结构准备发送包体
    ngx_buf_t *b;
    b = ngx_create_temp_buf(r->pool, response.len);
    if (b == NULL)
    {
        return NGX_HTTP_INTERNAL_SERVER_ERROR;
    }
    // 将Hello World拷贝到ngx_buf_t指向的内存中
    ngx_memcpy(b->pos, response.data, response.len);
    // 注意，一定要设置好last指针
    b->last = b->pos + response.len;
    // 声明这是最后一块缓冲区
    b->last_buf = 1;

    // 构造发送时的ngx_chain_t结构体
    ngx_chain_t out;
    // 赋值ngx_buf_t
    out.buf = b;
    // 设置next为NULL
    out.next = NULL;

    // 最后一步发送包体，http框架会调用ngx_http_finalize_request方法
    return ngx_http_output_filter(r, &out);
}
