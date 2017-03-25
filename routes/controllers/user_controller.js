/**
 * Created by lzr on 2017/2/21.
 */

var modelBlog = require('../../models/blog');

var modelUser = require('../../models/user');

//使用md5加密
var crypto=require("crypto");

//获取当前系统时间
var sd = require('silly-datetime');


/**
 * 跳转到用户的个人主页
 */
exports.user = function (req, res) {
    var customer = req.session.user.username;
    var query = {
        username : customer
    };
    modelUser.findOne(query, function (err, data) {
        if(err){
            console.log("查询用户失败："+ err);
            req.session.error = "查询用户失败";
            res.redirect('/toAddPage');
        }
        var imageUrl = data.imageUrl;
        res.render('user/profile', { title: 'Profile', customer: customer, imageUrl:imageUrl });
    });

};

/**
 * 修改密码
 */
exports.user_update_password = function (req, res) {
    /**
     * 服务器端校验
     */
    var username = req.body.username;
    var pwd = req.body.pwd;
    var pwd2 = req.body.pwd2;
    if( null == username || '' == username){
        console.log('用户名不能为空');
        req.session.error = "用户名不能为空";
        res.redirect('/profile');
    } else if(pwd != pwd2){
        console.log('两次输入的密码不一致');
        req.session.error = "两次输入的密码不一致";
        res.redirect('/profile');
    } else {
        /**
         * 校验成功
         * md5加密
         */
        var md5 = crypto.createHash("md5");
        var password = md5.update(pwd).digest("base64");
        /**
         * 数据库操作
         */
        var query = {
            username : username
        };
        var operator = {
            $set : { password : password }
        };
        modelUser.update(query, operator, function (err, data) {
            if(err){
                console.log("修改用户密码失败："+ err);
                req.session.error = "修改用户密码失败";
                res.redirect("/profile");
            }
            console.log("修改用户密码成功");
            req.session.success = '修改用户密码成功';
            /**
             * 返回视图
             */
            res.redirect('/profile');
        });
    }
};

/**
 * 跳转到他人主页
 */
exports.others = function (req, res) {
    var author = req.query.author;
    var query = {
        username : author
    };
    modelUser.findOne(query, function (err, data) {
        if(err){
            console.log("查询用户失败："+ err);
            req.session.error = "查询用户失败";
            res.redirect('/toAddPage');
        }
        var imageUrl = data.imageUrl;
        res.render('user/others', { title: 'others', author: author, imageUrl:imageUrl });
    });

};

/**
 * 跳转到注册页面
 * 暂时不用
 */
exports.toReg = function (req, res) {
    res.render('user/register', { title: 'Reg' });
};

/**
 * 注册功能
 */
exports.reg = function (req, res, next) {
    /**
     * 获取数据
     * @type {*}
     */
    var username = req.body.username;
    var password = req.body.password;

    /**
     * 服务器校验
     */
    if(username == null || username == undefined){
        console.log('用户名不能为空');
        req.session.error = "用户名不能为空";
        res.redirect("/toRegister_form");
    }else if(password == null || password == undefined){
        console.log('密码不能为空');
        req.session.error = "密码不能为空";
        res.redirect("/toRegister_form");
    }else {

        /**
         * 查询用户是否存在
         */
        modelUser.findOne({
            username: username
        }, function (err, data) {
            if(err){
                console.log("查询用户失败："+ err);
                req.session.error = "查询用户失败";
                res.redirect("/toRegister_form");
            }
            if(data){
                console.log("该用户已被注册");
                req.session.error = "该用户已被注册";
                res.redirect("/toRegister_form");
            }else {
                /**
                 * 密码加密
                 */
                var md5 = crypto.createHash('md5');
                var pwd = md5.update(password).digest("base64");

                var time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

                /**
                 * 注册
                 */
                var user= new modelUser({
                    username: username,
                    password: pwd,
                    createTime: time
                });
                user.save(function(err, data){

                    /**
                     * 新增操作异常
                     */
                    if(err){
                        console.log("注册异常:"+err);
                        res.redirect("/toRegister_form");
                    }


                    console.log("注册成功");

                    /**
                     * 新增成功
                     * @type {string}
                     */
                    req.session.user = data;

                    /**
                     * 返回视图
                     */
                    res.redirect('/');

                });
            }
        });


    }




};

/**
 * 跳转到登录页面
 * 暂时不用
 */
exports.toLogin = function (req, res, next) {
    res.render('user/login', { title: 'Login' });
};

/**
 * 登录功能
 */
exports.login = function (req, res) {
    /**
     * 获取数据
     * @type {*}
     */
    var username = req.body.username;
    var password = req.body.password;

    /**
     * 服务器校验
     */
    if(username == null || username == undefined){
        console.log('用户名不能为空');
        req.session.error = "用户名不能为空";
        res.redirect("/toLogin_form");
    }else if(password == null || password == undefined){
        console.log('密码不能为空');
        req.session.error = "密码不能为空";
        res.redirect("/toLogin_form");
    }else {

        /**
         * 查询用户是否存在
         */
        modelUser.findOne({
            username: username,
            delTag: false
        }, function (err, data) {
            if(err){
                console.log("查询用户名失败："+ err);
                req.session.error = "查询用户名失败";
                res.redirect("/toLogin_form");
            }
            if(!data){
                console.log('用户不存在');
                req.session.error = "用户不存在";
                res.redirect("/toLogin_form");
            }else {
                /**
                 * 将登录的密码转成md5形式
                 */
                var md5 = crypto.createHash("md5");
                var pwd = md5.update(password).digest("base64");
                /**
                 * 登录
                 */
                modelUser.findOne({
                    username: username,
                    password: pwd
                }, function (err, data) {
                    if(err){
                        console.log("查询用户密码失败："+ err);
                        req.session.error = "查询用户密码失败";
                        res.redirect("/toLogin_form");
                    }
                    if(!data){
                        console.log("密码不正确");
                        req.session.error = "密码不正确";
                        res.redirect("/toLogin_form");
                    }else {
                        console.log("登录成功");
                        /**
                         * 登录成功
                         * @type {string}
                         */
                        req.session.user = data;
                        /**
                         * 返回视图
                         */
                        res.redirect('/toAddPage');
                    }


                });

            }
        });


    }
};

/**
 * 注销功能
 */
exports.logout = function (req, res, next) {
    delete res.locals.user;
    res.render('weibo/blogList', { title: 'blogList' });
};

/**
 * 加关注功能
 */
exports.follow = function (req, res) {
    /**
     * 获取名称
     */
    var customer = req.session.user.username;
    var username = req.query.username;
    /**
     * 服务器端校验
     */
    if( null == username || '' == username){
        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        res.end();
    }else if(customer == username){
        console.log('逻辑错误：本人不应该在好友列表里');
        req.session.error = "逻辑错误：本人不应该在好友列表里";
        res.end();
    }else {
        /**
         * 添加好友
         */

        /**
         * 准备数据
         * @type {{username}}
         */
        var query = {
            username : customer
        };
        var friend = {
            username: username
        };
        var operator = {
            "$push" : { friends : friend }
        };
        /**
         * 执行修改追加操作
         */
        modelUser.update(query, operator, function (err, data) {
            if(err){
                console.log('添加好友失败：'+ err);
                return;
            }
            console.log('添加好友成功');
            // res.end();
        });
        /**
         * 返回
         */
        res.end();



    }



};

/**
 * 解除关注功能
 */
exports.unfollow = function (req, res) {
    /**
     * 获取名称
     */
    var customer = req.session.user.username;
    var username = req.query.username;
    /**
     * 服务器端校验
     */
    if( null == username || '' == username){
        console.log('必传参数不能为空');
        req.session.error = "必传参数不能为空";
        res.end();
    }else if(customer == username){
        console.log('逻辑错误：本人不应该在好友列表里');
        req.session.error = "逻辑错误：本人不应该在好友列表里";
        res.end();
    }else {
        /**
         * 添加好友
         */

        /**
         * 准备数据
         * @type {{username}}
         */
        var query = {
            username : customer
        };
        var friend = {
            username: username
        };
        var operator = {
            "$pull" : { friends : friend }
        };
        /**
         * 执行修改追加操作
         */
        modelUser.update(query, operator, function (err, data) {
            if(err){
                console.log('删除好友失败：'+ err);
                return;
            }
            console.log('删除好友成功');
            // res.end();
        });
        /**
         * 返回
         */
        res.end();



    }
};

/**
 * 查询个人全部微博功能
 */
exports.myBlogList = function (req, res) {
    var customer = req.session.user.username;
    var query = {
        author : customer
    };
    /**
     * 查询数据库
     */
    modelBlog.find(query, function (err, data) {
        if(err){
            console.log("查询微博失败:"+err);
            res.redirect("/");
        }

        /**
         * 返回数据
         */
        res.json({data: data});
        return data;

    }).sort({createTime: -1});
};

/**
 * 跳转到 上传头像 页面
 */
exports.toUploadCustomerImagePage = function (req, res) {

};

/**
 * 上传用户头像
 */
exports.uploadUserImage = function (req, res) {
    /**
     * 将图片地址关联到数据库
     */

    /**
     *  修改个人头像
     *  修改userSchema的imageUrl
     */
    var customer = req.session.user.username;
    var image_url = '/images/upload/' + req.file.originalname;
    var query = {
        username : customer
    };
    var operator = {
        $set : { imageUrl : image_url }
    };
    modelUser.update(query, operator, function (err, data) {
        if(err){
            console.log("修改userSchema的图片地址失败："+ err);
            req.session.error = "修改userSchema的图片地址失败";
            res.redirect("/profile");
        }
        console.log("修改userSchema的图片地址成功");
        req.session.success = '修改userSchema的图片地址成功';
    });

    /**
     *  批量 修改 blogSchema 的 imageUrl
     */
    var blogQuery = {
        author : customer
    };
    var blogOperator = {
        $set : { imageUrl : image_url }
    };
    modelBlog.update(blogQuery, blogOperator, {multi: true}, function (err, data) {
        if(err){
            console.log("修改blogSchema的图片地址失败："+ err);
            req.session.error = "修改blogSchema的图片地址失败";
            res.redirect("/profile");
        }
        console.log("修改blogSchema的图片地址成功");
        req.session.success = '修改blogSchema的图片地址成功';
    });

    /**
     *  批量修改relaySchema的imageUrl
     */
    var relayQuery = {
        "relayContent.author" : customer
    };
    var relayOperator = {
        $set : { "relayContent.imageUrl" : image_url }
    };
    modelBlog.update(relayQuery, relayOperator, {multi: true}, function (err, data) {
        if(err){
            console.log("修改relaySchema的图片地址失败："+ err);
            req.session.error = "修改relaySchema的图片地址失败";
            res.redirect("/profile");
        }
        console.log("修改relaySchema的图片地址成功");
        req.session.success = '修改relaySchema的图片地址成功';
    });

    /**
     *  批量修改commentSchema的imageUrl
     */
    var commentQuery = {
        "comments.author" : customer
    };
    var commentOperator = {
        $set : { "comments.$.imageUrl" : image_url }
    };
    modelBlog.update(commentQuery, commentOperator, {multi: true}, function (err, data) {
        if(err){
            console.log("修改commentSchema的图片地址失败："+ err);
            req.session.error = "修改commentSchema的图片地址失败";
            res.redirect("/profile");
        }
        console.log("修改commentSchema的图片地址成功");
        req.session.success = '修改commentSchema的图片地址成功';
    });

    /**
     * 返回数据
     * @type {string}
     */
    var url = 'http://' + req.headers.host + '/images/upload/' + req.file.originalname;
    res.json({
        code : 200,
        data : url
    });
    // res.end();
};

/**
 * 显示界面右上角的头像
 */
exports.showCustomerImage = function (req, res) {
    var user = req.session.user;
    if( '' != user && null != user){
        var customer = req.session.user.username;
        var query = {
            username : customer
        };
        modelUser.findOne(query, function (err, data) {
            if(err){
                console.log("查询用户失败："+ err);
                req.session.error = "查询用户失败";
                res.redirect('/toAddPage');
            }
            res.json({data: data});
            // return data;
        });
    }else {
        res.json({data: {'imageUrl': ''}});
    }



};

/**
 * 查询他人全部微博功能
 */
exports.otherBlogList = function (req, res) {
    var author = req.query.author;
    var query = {
        author : author
    };
    /**
     * 查询数据库
     */
    modelBlog.find(query, function (err, data) {
        if(err){
            console.log("查询微博失败:"+err);
            res.redirect("/");
        }

        /**
         * 返回数据
         */
        res.json({data: data});
        return data;

    }).sort({createTime: -1});
};

/**
 * 查询他人是否是好友
 */
exports.checkFriends = function (req, res) {
    var customer = req.session.user.username;
    var username = req.query.username;
    var query = {
        username : customer,
        "friends.username": username
    };
    /**
     * 查询数据库
     */
    modelUser.find(query, function (err, data) {
        if(err){
            console.log("查询好友列表失败:"+err);
            res.redirect("/");
        }

        /**
         * 返回数据
         */
        res.json({data: data});
        return data;

    });
};

/**
 * 查询好友列表
 */
exports.queryFriends = function (req, res) {
    var customer = req.session.user.username;
    var query = {
        username : customer,
        delTag: false
    };
    /**
     * 查询数据库
     */
    modelUser.find(query, function (err, data) {
        if(err){
            console.log("查询好友列表失败:"+err);
            res.redirect("/");
        }

        var friends = data[0].friends;

        /**
         * 返回数据
         */
        res.json({data: friends});

    });
};

/**
 * 查询好友微博
 */
exports.queryFriendsBlogList = function (req, res) {
    var customer = req.session.user.username;
    var query = {
        username : customer,
        delTag: false
    };
    /**
     * 查询数据库
     */
    modelUser.find(query, function (err, data) {
        if(err){
            console.log("查询好友列表失败:"+err);
            res.redirect("/");
        }

        var friends = data[0].friends;
        var names = [];
        for(var i = 0; i < friends.length; i++){
            names[i] = friends[i].username;
        }

        /**
         * 查询好友微博列表
         */
        var collection = {
            $in : names
        };
        var qry = {
            author : collection
        };
        modelBlog.find(qry, function (err, data) {
            if(err){
                console.log("查询好友列表失败:"+err);
                res.redirect("/");
            }
            res.json({data: data});
        }).sort({createTime: -1});

    });
};

/**
 * 跳转到 我的好友 页面
 */
exports.toFriendPage = function (req, res) {
    res.render('user/friends', { title: 'friends' });
};

/**
 * 跳转到注册页面
 */
exports.toRegister_form = function (req, res, next) {
    res.render('user/register_form', { title: 'register' });
};

/**
 * 跳转到登录页面
 */
exports.toLogin_form = function (req, res, next) {
    res.render('user/login_form', { title: 'Login' });
};