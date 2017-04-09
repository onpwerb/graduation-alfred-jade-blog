# 基于nodejs的微博系统
使用nodejs+express4+mongodb技术进行开发,少部分使用到angularJs。前端与后台逻辑的交互基本上是通过ajax的异步调用实现。

## 启动项目
1. 启动mongodb服务
2. 启动redis服务
3. 输入命令
- 安装和导入node_modules模块： npm install
- 启动node工程：npm start 或者 node app.js


## 功能模块
1. 前台
- 邮箱注册
- 验证码登录
- 上传头像
- 显示微博列表
- 写微博(使用angularJS显示输入字数)
- 微博详情
- 评论(添加评论、删除评论)
- 转发微博
- 点赞、取消赞(显示点赞列表、向点赞列表添加/移除当前用户、点赞次数加/减一)
- 加关注、解除关注
- 个人中心：修改密码
- 个人微博列表
- 我的好友列表
- 好友微博

2. 后台
- 管理员登录
- 用户管理(冻结、解封用户)
- 微博列表(查看微博详情)
- 转发微博(查看转发微博详情)
- 使用redis统计网站访问量

## 实现细节
- 界面UI

使用gentelella这个开源项目进行界面设计。

- mongodb数据库时间格式转化

使用moment.js和silly-datetime模块解决。

- 后台表格

使用datatable插件，在JS里配置相关参数进行调用。

- 上传头像

使用文件上传中间件multer

- 设置服务器地址、文件上传地址

导入config模块，在项目全局编写一个配置文件，配置相关参数

- 日志打印

使用log4js实现，同时在配置文件里要确定日志文件输出目录

- 登录验证码

使用ccap和qr-image模块产生和显示验证码

- 注册邮箱验证

使用uuid和nodemailer模块编写发送邮件逻辑

- 统计当天网站访问量

本地配置redis服务，使用redis模块，与node工程进行整合调用




