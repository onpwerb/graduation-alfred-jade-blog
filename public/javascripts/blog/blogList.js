/**
 * Created by lzr on 2017/3/7.
 */

/**
 * 异步查询数据库
 * 返回数据
 */
var customer = $('#customer').val();
var page = $('#page').val();
var url = '/showBlogList?page='+page;

$.ajax({
    url: url,
    type: "post",
    dataType: "json",
    success:function(result){
        var data = result.data;
        for(var i = 0; i < data.length; i++){
            /**
             * 获取数据
             * @type {*}
             */
            var author = data[i].author;
            var title = data[i].title;
            var content = data[i].content;
            var createTime = moment(data[i].createTime).format('YYYY-MM-DD HH:mm:ss');
            var relayTag = data[i].relayTag;
            var imageUrl = data[i].imageUrl;

            var relayHtml = '';
            /**
             * 添加转发图层
             */
            if(relayTag){
                /**
                 * 获取数据
                 */
                var relayContent = data[i].relayContent;

                var relay_author = relayContent.author;
                var relay_title = relayContent.title;
                var relay_content = relayContent.content;
                var relay_imageUrl = relayContent.imageUrl;
                /**
                 * 添加视图
                 */
                /**
                 * 添加视图
                 */
                relayHtml +=
                    '<ul class="messages">' +
                        '<li><img src="'+ relay_imageUrl +'" alt="Avatar" class="avatar" />' +
                            '<div class="message_wrapper">' +
                                '<h4><a href="#" name="others">'+ relay_author +'</a></h4>' +
                                '<h4>'+ relay_title + '<br>'+ relay_content + '</h4>'+
                            '</div>'+
                        '</li>' +
                    '</ul>';
            }

            /**
             * 显示微博内容
             */
            $('#blogList').append(
                '<div class="panel">' +
                    '<ul class="list-group">' +
                        '<li class="list-group-item list-group-item-success">'+
                            /**
                             * 微博标题、内容等
                             */
                            '<div class="block">'+
                                '<ul class="messages">' +
                                    '<li><img src="'+ imageUrl +'" alt="Avatar" class="avatar" />' +
                                        '<div class="message_wrapper">' +
                                            '<h4 class="heading"><a href="#" name="others">'+ author +'</a></h4>' +
                                            '<small>'+ createTime +'</small>' +
                                            '<h4>'+
                                            '<a href="#">'+
                                                title +
                                            '</a><br>'+
                                            content +
                                            relayHtml +
                                            '</h4>'+
                                        '</div>'+
                                    '</li>' +
                                '</ul>' +
                            '</div>'+
                        '</li>'+
                    '</ul>'+
                '</div>'
            );
        }

        var pageTotal = result.pageTotal;

        var pageHtml = '';
        for(var i = 1; i <= pageTotal; i++){
            if(i == page){
                pageHtml += '<li class="active"><a href="/index?page='+ i+'">'+ i +'</a></li>';
            }else {
                pageHtml += '<li><a href="/index?page=' + i + '">'+ i +'</a></li>';
            }
        }

        var pageLeft = page - 1;
        if(pageLeft <= 0){
            pageLeft = 1;
        }

        var pageRight = page + 1;
        if(pageRight >= pageTotal){
            pageRight = pageTotal;
        }

        $('#blogList').append(
            '<nav aria-label="Page navigation">'+
                '<ul class="pagination">'+
                    '<li>'+
                        '<a href="/index?page=' + pageLeft + '" aria-label="Previous">'+
                            '<span aria-hidden="true">&laquo;</span>'+
                        '</a>'+
                    '</li>'+
                    pageHtml+
                    '<li>'+
                        '<a href="/index?page=' + pageRight + '" aria-label="Next">'+
                            '<span aria-hidden="true">&raquo;</span>'+
                        '</a>'+
                    '</li>'+
                '</ul>'+
            '</nav>'
        );

    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
        alert("在未登录前的微博列表中执行显示所有微博的操作失败 : XMLHttpRequest.readyState="+ XMLHttpRequest.readyState+ '\n' + textStatus.toString()+ '\n' + errorThrown.toString());
    }
});