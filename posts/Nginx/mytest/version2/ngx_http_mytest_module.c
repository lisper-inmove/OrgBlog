#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>


static char *
ngx_http_mytest(ngx_conf_t *cf, ngx_command_t *cmd, void *conf);

static ngx_int_t ngx_http_mytest_handler(ngx_http_request_t *r);


typedef struct {
    ngx_str_t my_str;
    ngx_int_t my_num;
    ngx_flag_t my_flag;
    size_t my_size;
    ngx_array_t* my_str_array;
    ngx_array_t* mykeyval;
    off_t my_off;
    ngx_msec_t my_msec;
    time_t mySec;
    ngx_bufs_t my_bufs;
    ngx_uint_t my_enum_seq;
    ngx_uint_t my_bitmask;
    ngx_uint_t my_access;
    ngx_path_t* my_path;
} ngx_http_mytest_conf_t;

static ngx_command_t  ngx_http_mytest_commands[] = {

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

static void *ngx_http_mytest_create_loc_conf(ngx_conf_t cf) {
    ngx_http_mytest_conf_t mycf;
    mfcy = (ngx_http_mytest_conf_t *)ngx_pcalloc(cf->pool, sizeof(ngx_http_mytest_conf_t));
    if (mycf == NULL) return NULL;
    mycf->my_flag = NGX_CONF_UNSET;
    mycf->my_num = NGX_CONF_UNSET;
    mycf->my_str_array = NGX_CONF_UNSET_PTR;
    mycf->my_keyval = NULL;
    mycf->my_off = NGX_CONF_UNSET;
    mycf->my_msec = NGX_CONF_UNSET_MSEC;
    mycf->my_sec = NGX_CONF_UNSET;
    mycf->my_size = NGX_CONF_UNSET_SIZE;
    return mycf;

}

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
