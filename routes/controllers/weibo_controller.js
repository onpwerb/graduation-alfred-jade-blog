/**
 * Created by lzr on 2017/2/21.
 */

var modelBlog = require('../../models/blog');

var modelUser = require('../../models/user');

var redis = require("redis"),
    client = redis.createClient();

//获取当前系统时间
var sd = require('silly-datetime');

/**
 * 使用log4js
 * @type {Logger}
 */
var Logger = require("../Logger.js").getLogger();

/**
 * 访问网站主页
 */
exports.toLoadTraffic = function (req, res) {
    var time = sd.format(new Date(), 'YYYY-MM-DD');
    var key = 'traffic-' + time;
    client.incr(key);
    res.end();
};

/**
 * 跳转到写微博页面
 */
exports.toAddPage = function (req, res) {
    var time = sd.format(new Date(), 'YYYY-MM-DD');
    var key = 'traffic-' + time;
    client.incr(key);
    var customer = req.session.user.username;
    Logger.info("customer: %s, 进入写微博页面", customer);
    var page = req.query.page;
    res.render('weibo/pubBlog', { title: 'pubBlog', customer: customer, pageNum : page });
};

/**
 * 写微博
 */
exports.add = function (req, res) {
    var customer = req.session.user.username;
    /**
     * 获取数据
     */
    var title = req.body.title;
    var description = req.body.description;
    var author = req.session.user.username;
    /**
     * 服务器端表单校验
     */
    if(title == null || title == undefined){
        console.log('标题不能为空');
        req.session.error = "标题不能为空";
        res.redirect("/toAddPage?page=1");
    }else if(description == null || description == undefined){
        console.log('内容不能为空');
        req.session.error = "内容不能为空";
        res.redirect("/toAddPage?page=1");
    }else if (author == null || author == undefined){
        console.log('作者不能为空');
        req.session.error = "作者不能为空";
        res.redirect("/toAddPage?page=1");
    }else {
        /**
         * 防止html注入
         */
        description=description.replace(/&/g,"&amp;");
        description=description.replace(/</g,"&lt;");
        description=description.replace(/ /g,"&nbsp;");
        description=description.replace(/>/g,"&gt;");
        description=description.replace(/\\/g,"&quot;");
        description=description.replace(/'/g,"&qpos;");

        // console.log(description);

        /**
         * 根据 用户名 得到 头像地址
         */
        var imageUrl = '';
        modelUser.findOne({ username : author}, function (err, data) {
            if(err){
                console.log("查询用户失败："+ err);
                req.session.error = "查询用户失败";
                Logger.info("customer: %s, 根据用户名得不到头像地址：%s", customer, err);
                res.redirect('/toAddPage?page=1');
            }
            imageUrl = data.imageUrl;

            /**
             * 插入微博
             */

            var time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

            var relayNum = 0;

            var blog = new modelBlog({
                author: author,
                title: title,
                content: description,
                createTime: time,
                imageUrl : imageUrl,
                relayNum : relayNum
            });

            blog.save(function (err, data) {
                /**
                 * 新增操作异常
                 */
                if(err){
                    console.log("发微博操作异常:"+err);
                    Logger.info("customer: %s, 发微博操作异常：%s", customer, err);
                    res.redirect("/toAddPage?page=1");
                }
                /**
                 * 新增成功
                 * 返回视图
                 */
                console.log("成功发布微博");
                Logger.info("customer: %s, 发布微博, 标题：%s", customer, title);

                res.redirect('/toAddPage?page=1');
            });

        });



    }

};

/**
 * 跳转到微博列表页面
 */
exports.toBlogListPage = function (req, res) {
    res.render('weibo/blogList', { title: 'blogList', pageNum: req.query.page });
};

/**
 * 显示微博列表
 */
exports.showBlogList = function (req, res) {

    var page = req.query.page; //第几页
    var rows = 5; //一页有几行记录

    var query = modelBlog.find({}).sort({createTime: -1});
    query.skip((page - 1) * rows); //跳过几行记录，获得其余数据
    query.limit(rows);              //取前几行数据

    query.exec(function (err, data) {
        if(err){
            console.log("查询微博失败:"+err);
            Logger.info("显示登录前的微博列表失败：%s", err);
            res.redirect("/");
        }
        Logger.info("显示登录前的微博列表");
        /**
         * data保存了该页的数据
         * result.length保存了记录的总行数
         * pageTotal保存了最大页码
         */
        modelBlog.find({}, function (err, result) {
            var pageTotal = parseInt((result.length)/rows);
            if( result.length % rows != 0){
                pageTotal += 1;
            }

            var jsonOjbect = {data: data, total: result.length, pageTotal: pageTotal};
            Logger.info("微博列表数据：{}", jsonOjbect);
            res.json(jsonOjbect);

        });

    });


};

/**
 * 跳转到微博详情页面
 */
exports.toDetailBlogPage = function (req, res) {
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;
    var customer = req.session.user.username;
    res.render('weibo/detailBlog', { author: author, title: title, customer: customer, content: content });
};

/**
 * 显示微博详情
 */
exports.showDetailBlog = function (req, res) {
    var customer = req.session.user.username;
    /**
     * 获取查询条件
     */
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;

    var query = {
        author : author,
        title : title,
        content : content
    };


    /**
     * 查询数据库
     */
    modelBlog.find(query, function (err, data) {
        if(err){
            console.log("查询微博失败:"+err);
            Logger.info("customer: %s, 查看 %s 的微博, 标题：%s , 失败：%s", customer, author, title, err);
            res.redirect("/");
        }
        Logger.info("customer: %s, 查看 %s 的微博, 标题：%s", customer, author, title);
        /**
         * 返回数据
         */
        res.json({data: data});
        return data;

    });
};

/**
 * 跳转到评论微博页面
 */
exports.toCommentBlogPage = function (req, res) {
    res.render('weibo/comment', { title: 'comment' });
};

/**
 * 评论微博
 */
exports.commentBlog = function (req, res) {
    /**
     * 获取数据
     */
    var customer = req.session.user.username;
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;

    var comment_author = customer;
    var comment_content = req.query.comment_content;
    var comment_createTime = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

    /**
     * 服务器端校验
     */
    if( null == author || '' == author
        || null == title || '' == title
        || null == comment_content || '' == comment_content){

        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        return;
    }
    /**
     * 根据 用户名 得到 头像地址
     */
    var comment_imageUrl = '';
    modelUser.findOne({ username : customer}, function (err, data) {
        if(err){
            console.log("查询用户失败："+ err);
            req.session.error = "查询用户失败";
            Logger.info("customer: %s, 评论微博功能, 根据用户名 %s 得到头像地址失败：%s", customer, customer, err);
            res.redirect('/toAddPage?page=1');
        }
        comment_imageUrl = data.imageUrl;

        /**
         * 准备数据
         * @type {{author: (*), title}}
         */
        var query = {
            author : author,
            title : title
        };

        var comment = {
            author : comment_author,
            content : comment_content,
            createTime : comment_createTime,
            imageUrl : comment_imageUrl
        };

        var operator = {
            // $unset : { comments : comment }
            // $set : { comments : comment }
            "$push" : { comments : comment }
        };

        /**
         * 往该微博里添加评论数据
         * 执行修改追加操作
         */
        modelBlog.update(query, operator, function (err, data) {
            if(err){
                console.log('添加评论失败：'+ err);
                Logger.info("customer: %s, 往用户 %s 的微博 %s ,添加评论失败：%s", customer, author, title, err);
                return;
            }

            Logger.info("customer: %s, 往用户 %s 的微博 %s ,添加评论", customer, author, title);

            console.log('添加评论成功');
            // res.end();

        });

        /**
         * 返回视图
         */
        // res.redirect('/toAddPage?page=1');
        res.redirect('/toDetailBlogPage?author='+author+'&title='+title+'&content='+content);
        // res.end();

    });



};

/**
 * 删除单条评论
 */
exports.delComment = function (req, res) {
    /**
     * 获取数据
     */
    var customer = req.session.user.username;
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;
    var comment_author = customer;
    var comment_content = req.query.comment_content;
    var comment_createTime = req.query.comment_createTime;
    comment_createTime = sd.format(comment_createTime, 'YYYY-MM-DD HH:mm:ss');

    /**
     * 服务器端校验
     */
    if( null == comment_createTime || '' == comment_createTime
        || null == comment_content || '' == comment_content){
        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        res.end();
        return;
    }

    /**
     * 准备数据
     * @type {{author: (*), title}}
     */
    var query = {
        author : author,
        title : title
    };

    var comment = {
        author : comment_author,
        content : comment_content,
        createTime : comment_createTime
    };

    var operator = {
        $pull : { comments : comment }
    };

    /**
     * 往该微博里删除评论数据
     * 执行修改移除操作
     */
    modelBlog.update(query, operator, function (err, data) {
        if(err){
            console.log('删除评论失败：'+ err);
            Logger.info("customer: %s, 在用户 %s 的微博 %s ,删除评论失败：%s", customer, author, title, err);
            return;
        }
        console.log('删除评论成功');
        Logger.info("customer: %s, 在用户 %s 的微博 %s ,删除评论", customer, author, title);
    });

    /**
     * 返回视图
     */
    res.redirect('/toDetailBlogPage?author='+author+'&title='+title+'&content='+content);
};

/**
 * 删除单条微博
 */
exports.delBlog = function (req, res) {
    var customer = req.session.user.username;
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;

    if(author == null || author == ''){
        console.log('作者不能为空');
        req.session.error = "作者不能为空";
        res.redirect("/");
        return;
    }
    if(title == null || title == ''){
        console.log('标题不能为空');
        req.session.error = "标题不能为空";
        res.redirect("/");
        return;
    }
    var query = {
        author: author,
        title: title,
        content: content
    };
    modelBlog.remove(query, function (err, data) {
        if(err){
            console.log("删除微博失败:"+err);
            Logger.info("customer: %s, 删除微博, 标题： %s , 失败：%s", customer, title, err);
            res.redirect("/");
        }

        /**
         * 删除成功
         * 返回视图
         */
        console.log("删除微博成功");
        Logger.info("customer: %s, 删除微博, 标题： %s ", customer, title);
        // res.redirect("/toAddPage?page=1");
        res.end();

    });

};

/**
 * 跳转到转发微博页面
 */
exports.toForwardBlogPage = function (req, res) {

};

/**
 * 转发微博
 */
exports.forwardBlog = function (req, res) {
    /**
     * 逻辑：
     * 将原来的微博作为子文档，
     * 新建一条作者是当前用户、没有标题、内容是转发理由、包含子文档的新微博
     */

    /**
     * 获取数据
     */
    var customer = req.session.user.username;

    //子文档内容
    var relay_author = req.query.relay_author;
    var relay_title = req.query.relay_title;
    var relay_content = req.query.relay_content;

    //父文档内容
    var author = customer;
    var content = req.query.blog_content;
    var createTime = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    var relayTag = true;
    var title = '转发微博';
    // var title = '转发微博:【'+relay_title+'】';

    /**
     * 服务器端校验
     */
    if(null == author || '' == author || null == content || '' == content ||
        null == createTime || '' == createTime || null == relay_author || '' == relay_author ||
        null == relay_title || '' == relay_title || null == relay_content || '' == relay_content){

        console.log("必传参数为空");
        res.redirect("/toAddPage?page=1");
        return;
    }
    /**
     * 原来微博转发数加一
     */
    var query = {
        author : relay_author,
        title : relay_title
    };

    var operator = {
        $inc : { relayNum : 1 }
    };

    modelBlog.update(query, operator, function (err, data) {
        if(err){
            console.log('添加转发次数失败：'+ err);
            Logger.info("customer: %s, 向用户 %s 的微博 %s ,添加转发次数失败：%s", customer, relay_author, relay_title, err);
            return;
        }
        Logger.info("customer: %s, 向用户 %s 的微博 %s ,添加转发次数", customer, relay_author, relay_title);
    });

    /**
     * 转发微博
     * 新建一条微博记录
     */
    /**
     * 根据 用户名 得到 头像地址
     */
    var imageUrl = '';
    var relay_imageUrl = '';
    modelUser.findOne({ username : customer}, function (err, data) {
        if(err){
            console.log("查询用户失败："+ err);
            req.session.error = "查询用户失败";
            res.redirect('/toAddPage?page=1');
        }
        imageUrl = data.imageUrl;

        modelUser.findOne({ username : relay_author}, function (err, data) {
            if(err){
                console.log("查询用户失败："+ err);
                req.session.error = "查询用户失败";
                res.redirect('/toAddPage?page=1');
            }
            relay_imageUrl = data.imageUrl;

            /**
             * 得到子文档
             */
            var relayBlog = {
                imageUrl: relay_imageUrl,
                author: relay_author,
                title: relay_title,
                content: relay_content
            };

            /**
             * 父文档其他参数
             */
            var blog = new modelBlog({
                imageUrl: imageUrl,
                author: author,
                title : title,
                content: content,
                relayContent: relayBlog,
                relayTag : relayTag,
                createTime : createTime
            });

            /**
             * 新建文档
             */
            blog.save(function (err, data) {
                /**
                 * 新增操作异常
                 */
                if(err){
                    console.log("转发微博操作异常:"+err);
                    Logger.info("customer: %s, 转发微博操作异常：%s", customer, err);
                    res.redirect("/toAddPage?page=1");
                }
                /**
                 * 新增成功
                 * 返回视图
                 */
                console.log("成功转发微博");
                Logger.info("customer: %s, 转发 %s 的微博, 标题：%s", customer, relay_author, relay_title);

                res.redirect('/toAddPage?page=1');
            });

        });


    });



};

/**
 * 点赞
 */
exports.like = function (req, res) {
    var customer = req.session.user.username;
    /**
     * 获取微博作者 微博标题
     */
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;
    /**
     * 服务器端校验
     */
    if( null == author || '' == author
        || null == title || '' == title
        || null == content || '' == content){

        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        return;
    }
    /**
     * 对该微博的 likes 字段进行修改操作
     */
    var query = {
        author : author,
        title : title,
        content : content
    };

    var operator = {
        $inc : { likes : 1 }
    };

    modelBlog.update(query, operator, function (err, data) {
        if(err){
            console.log('添加点赞次数失败：'+ err);
            Logger.info("customer: %s, 向用户 %s 的微博 %s ,点赞失败：%s", customer, author, title, err);
            return;
        }
        Logger.info("customer: %s, 向用户 %s 的微博 %s ,点赞", customer, author, title);
    });

    /**
     * 返回视图
     */
    // res.redirect('/toDetailBlogPage?author='+author+'&title='+title);
    res.end();

};

/**
 * 取消赞
 */
exports.unlike = function (req, res) {
    var customer = req.session.user.username;
    /**
     * 获取微博作者 微博标题
     */
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;
    /**
     * 服务器端校验
     */
    if( null == author || '' == author
        || null == title || '' == title
        || null == content || '' == content){

        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        return;
    }
    /**
     * 对该微博的 likes 字段进行修改操作
     */
    var query = {
        author : author,
        title : title,
        content : content
    };

    var operator = {
        $inc : { likes : -1 }
    };

    modelBlog.update(query, operator, function (err, data) {
        if(err){
            console.log('减少点赞次数失败：'+ err);
            Logger.info("customer: %s, 向用户 %s 的微博 %s ,取消赞失败：%s", customer, author, title, err);
            return;
        }
        Logger.info("customer: %s, 向用户 %s 的微博 %s ,取消赞", customer, author, title);
    });

    /**
     * 返回视图
     */
    // res.redirect('/toDetailBlogPage?author='+author+'&title='+title);
    res.end();

};

/**
 * 查询点赞列表
 */
exports.queryPraiseList = function (req, res) {
    /**
     * 获取数据
     */
    var customer = req.session.user.username;
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;

    /**
     * 服务器端校验
     */
    if( null == author || '' == author
        || null == title || '' == title
        || null == content || '' == content){
        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        return;
    }

    /**
     * 准备数据
     * @type {{author: (*), title}}
     */
    var query = {
        author : author,
        title : title,
        praiseList : customer,
        content : content
    };

    /**
     * 往该微博里查询点赞列表数据 是否有当前用户
     */
    modelBlog.findOne(query, function (err, data) {
        if(err){
            console.log('查询点赞列表：'+ err);
            Logger.info("customer: %s, 往用户 %s 的微博 %s ,查询点赞列表失败：%s", customer, author, title, err);
            return;
        }

        Logger.info("customer: %s, 往用户 %s 的微博 %s ,查询点赞列表", customer, author, title);

        console.log('查询点赞列表成功');
        /**
         * 返回数据
         */
        res.json({data: data});
        return data;
    });
};

/**
 * 将当前用户添加到点赞列表
 */
exports.addToPraiseList = function (req, res) {
    /**
     * 获取数据
     */
    var customer = req.session.user.username;
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;

    /**
     * 服务器端校验
     */
    if( null == author || '' == author
        || null == title || '' == title
        || null == content || '' == content){
        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        return;
    }

    /**
     * 准备数据
     * @type {{author: (*), title}}
     */
    var query = {
        author : author,
        title : title,
        content : content
    };

    var operator = {
        "$push" : { praiseList : customer }
    };

    /**
     * 往该微博里添加点赞列表数据
     * 执行修改追加操作
     */
    modelBlog.update(query, operator, function (err, data) {
        if(err){
            console.log('向点赞列表添加当前用户失败：'+ err);
            Logger.info("customer: %s, 往用户 %s 的微博 %s ,向点赞列表添加当前用户失败：%s", customer, author, title, err);
            return;
        }

        Logger.info("customer: %s, 往用户 %s 的微博 %s ,向点赞列表添加当前用户", customer, author, title);

        console.log('向点赞列表添加当前用户成功');
        // res.end();

    });

    /**
     * 返回视图
     */
    res.end();
};

/**
 * 将当前用户从点赞列表中移除
 */
exports.rmFromPraiseList = function (req, res) {
    /**
     * 获取数据
     */
    var customer = req.session.user.username;
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;

    /**
     * 服务器端校验
     */
    if( null == author || '' == author
        || null == title || '' == title
        || null == content || '' == content){
        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        return;
    }

    /**
     * 准备数据
     * @type {{author: (*), title}}
     */
    var query = {
        author : author,
        title : title,
        content : content
    };

    var operator = {
        "$pull" : { praiseList : customer }
    };

    /**
     * 往该微博里移除点赞列表中的某个数据
     * 执行修改操作
     */
    modelBlog.update(query, operator, function (err, data) {
        if(err){
            console.log('向点赞列表移除当前用户失败：'+ err);
            Logger.info("customer: %s, 往用户 %s 的微博 %s ,向点赞列表移除当前用户失败：%s", customer, author, title, err);
            return;
        }

        Logger.info("customer: %s, 往用户 %s 的微博 %s ,向点赞列表移除当前用户", customer, author, title);

        console.log('向点赞列表移除当前用户成功');
        // res.end();

    });

    /**
     * 返回视图
     */
    res.end();
};

/**
 * 查询当前微博的点赞次数
 */
exports.queryPraiseNums = function (req, res){
    /**
     * 获取数据
     */
    var customer = req.session.user.username;
    var author = req.query.author;
    var title = req.query.title;
    var content = req.query.content;

    /**
     * 服务器端校验
     */
    if( null == author || '' == author
        || null == title || '' == title
        || null == content || '' == content){
        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        return;
    }

    /**
     * 准备数据
     * @type {{author: (*), title}}
     */
    var query = {
        author : author,
        title : title,
        content : content
    };

    /**
     * 查询这条微博的点赞次数
     */
    modelBlog.findOne(query, function (err, data) {
        if(err){
            console.log('查询这条微博的点赞次数失败：'+ err);
            Logger.info("customer: %s, 往用户 %s 的微博 %s ,查询这条微博的点赞次数失败：%s", customer, author, title, err);
            return;
        }
        Logger.info("customer: %s, 往用户 %s 的微博 %s ,查询这条微博的点赞次数", customer, author, title);
        // console.log('查询这条微博的点赞次数成功');
        /**
         * 获取点赞次数
         */
        var number = data.likes;
        /**
         * 发送数据
         */
        res.json({data: number});

    });

};