/**
 * Created by lzr on 2017/2/21.
 */



var modelUser = require('../../models/user');



/**
 * 跳转到用户的个人主页
 */
exports.user = function (req, res) {
    res.render('user/others', { title: 'others' });
    // res.render('user/profile', { title: 'Profile' });
};

/**
 * 跳转到注册页面
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
        res.send('用户名不能为空');
        // next();
    }else if(password == null || password == undefined){
        res.send('密码不能为空');
        // next();
    }else {


        var user= new modelUser({
            username: username,
            password: password
        });
        user.save(function(err, data){

            /**
             * 新增操作异常
             */
            if(err){
                console.log("注册异常:"+err);
                return;
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




};

/**
 * 跳转到登录页面
 */
exports.toLogin = function (req, res, next) {
    res.render('user/login', { title: 'Login' });
};

/**
 * 登录功能
 */
exports.login = function (req, res) {

};

/**
 * 注销功能
 */
exports.logout = function (req, res, next) {
    res.locals.user = null;
    res.render('index/welcome', { title: 'Blog' });
};

/**
 * 加关注功能
 */
exports.follow = function (req, res) {

};

/**
 * 解除关注功能
 */
exports.unfollow = function (req, res) {

};