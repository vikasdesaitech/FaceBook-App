var page;
var page_response=null;
var first_time=true;

window.fbAsyncInit = function() {
    FB.init({
        appId : '110259656277845',
        cookie : true,
        xfbml : true,
        version : 'v2.8'
    });

    FB.getLoginStatus(function(response) {  
        if (response.status === 'connected' && first_time==false) {
            statusChangeCallbackAfterLogIn(response);   
            first_time=false;
        }
        else if(first_time==true){
            statusChangeCallback(response);
        }

    });

    FB.AppEvents.logPageView();
};

(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function statusChangeCallbackAfterLogIn(response){
    if (response.status === 'connected') {
        //console.log('loggedIn');
        setElements(true);            
        //connectAPI();
    } else {
        //console.log('no Auth');
        setElements(false);
    }
}

function statusChangeCallback(response) {
    if (response.status === 'connected') {
        //console.log('loggedIn');
        setElements(true);            
        connectAPI();
    } else {
        //console.log('no Auth');
        setElements(false);
    }
}

function connectAPI(){
    FB.api('/me?fields=picture.width(400),cover.width(1000),id,name,email,birthday,location', function(response){
        if(response && !response.error){
            //console.log(response);
            profileBuild(response);
        }

        DisplayTimeLinePosts();

        FB.api('/me?fields=accounts', function(response){
            if(response && !response.error){
                if(response.accounts.data.length>0){
                    page=response.accounts.data[0];
                    DisplayPublishedPagePost(); 
                }
                else 
                    document.getElementById("display_after_login").style.display='none';    
                pageInformation(response);
            }
            else{
                document.getElementById("display_after_login").style.display='none'; 
            }
        });
    });
}

function pageInformation(response){
    var select = document.getElementById("dropdownForPage");
    page_response=response;
    if(response.accounts.data.length>0){
        for(var i = 0; i < response.accounts.data.length; i++) {
            var account=response.accounts.data[i];
            select.innerHTML += `<option value=${account.id}> ${account.name}</option>`;
        }
    }
}

function changePage(){
    var e = document.getElementById("dropdownForPage").value;
    var temp=page_response;
    if(page_response!=null){
        for(var i=0; i<page_response.accounts.data.length; i++){
            if(page_response.accounts.data[i].id==e)
                page=page_response.accounts.data[i];
        }
    }
    DisplayPublishedPagePost();
}

document.getElementById("postButton").addEventListener("click", PublishProfilePost);
function PublishProfilePost(){
    var postMessage=document.getElementById('postFromProfileTextBox').value;
    FB.api('me/feed', 'POST', {'message': postMessage},function (response) {
        if (response && !response.error) {
            DisplayTimeLinePosts();
            document.getElementById('postFromProfileTextBox').value="";
        }
    });
}

document.getElementById("PublishPagePost1").addEventListener("click", PublishPagePost);
document.getElementById("PublishPagePost2").addEventListener("click", PublishPagePost);
function PublishPagePost(){
    var postMessage=document.getElementById('postFromPageTextBox').value;
    FB.api((page.id+'/feed'), 'POST', {'message': postMessage, 'access_token': (page.access_token)},function (response) {
        if (response && !response.error) {
            DisplayPublishedPagePost();
            document.getElementById('postFromPageTextBox').value="";
        }
    });
}

document.getElementById("UnPublishPagePost").addEventListener("click", UnPublishPagePost);
function UnPublishPagePost(){
    var postMessage=document.getElementById('postFromPageTextBox').value;
    FB.api((page.id+'/feed'), 'POST', {'message': postMessage, 'access_token': (page.access_token), 'published':false},function (response) {
        if (response && !response.error) {
            DisplayUnPublishedPagePost();
            document.getElementById('postFromPageTextBox').value="";
        }
    });
}

function DisplayTimeLinePosts(){
    var url='/me/feed?fields=message,story,type,source,full_picture,likes.limit(0).summary(true),created_time';
    Get(url, "timeLine");
}

function DisplayPublishedPagePost(){
    var url=page.id+'/feed?fields=message,story,type,source,full_picture,likes.limit(0).summary(true),insights.metric(post_impressions_unique),created_time';
    Get(url, "page");
}

function DisplayUnPublishedPagePost(){
    var url=page.id+'/promotable_posts?is_published=false&fields=message,story,type,source,full_picture,likes.limit(0).summary(true),insights.metric(post_impressions_unique),created_time'
    Get(url, "page");
}

function profileBuild(user){
    var profile=`
<div class="cover_photo">
<div class="pic_base" style="background-image: url(${user.cover.source});">
<img src="${user.picture.data.url}" width="200px" id="profile_pic" alt="">
</div>          
<h1 id="user_name">${user.name}</h1>
</div>
`;
    document.getElementById('profilePhoto').innerHTML = profile;   

    var user_info=`
<div class="well" id="user_info">
<ul class="list-group">
<li class="list-group-item">Email id: ${user.email}</li>
<li class="list-group-item">Birth Day: ${user.birthday}</li>
</ul>
</div>
`
    document.getElementById('user_information').innerHTML=user_info;
}

function feedBuildProfile(feed){
    let output='<h3>TimeLine</h3>';
    output+=`<table class="table table-bordered"><thead class="thead-default">
<tr>
<th class="messageColumn1">Posts</th>
<th class="actionsColumn">Likes</th>
<th class="timeColumn">Published</th>
</tr></thead><tbody>`;
    for(let i in feed.data){
        var date= new Date(feed.data[i].created_time);

        output+=`
<tr class="well">`;

        if(feed.data[i].type=="photo"){
            var a=feed.data[i].story;
            output+=`<td class="messageColumn1"><a href="${feed.data[i].full_picture}" target="_blank">${feed.data[i].story}</a></td>`;
        }
        else if(feed.data[i].type=="video"){
            var a=feed.data[i].story;
            output+=`<td class="messageColumn1"><a href="${feed.data[i].source}" target="_blank">${feed.data[i].story}</a></td>`
        }
        else if(feed.data[i].type=="status"){
            var msg=feed.data[i].message;
            if(msg==undefined)
                output+=`<td class="messageColumn1">${feed.data[i].story}</td>`;
            else
                output+=`<td class="messageColumn1">${feed.data[i].message}</td>`;
        }
        else{
            var a=feed.data[i].story;
            output+=`<td class="messageColumn1">${feed.data[i].story}</td>`;
        }

        output+=`
<td class="actionsColumn">${feed.data[i].likes.summary.total_count}</td>
<td class="timeColumn">${date.toDateString()} at ${date.getHours()}:${date.getMinutes()}</td>
</tr>`;
    }
    output+=`</tbody></table>`;
    document.getElementById('profile_feed').innerHTML = output; 
}

function feedBuildPage(feed){
    let output=`<table class="table table-bordered"><thead class="thead-default">
<tr>
<th class="messageColumn2">Posts</th>
<th class="actionsColumn">Viewed</th>
<th class="actionsColumn">Likes</th>
<th class="timeColumn">Published</th>
</tr></thead><tbody>`;
    for(let i in feed.data){
        var date= new Date(feed.data[i].created_time);  

        output+=`
<tr class="well">`;

        if(feed.data[i].type=="photo"){
            output+=`<td class="messageColumn2"><a href="${feed.data[i].full_picture}" target="_blank">Photo</a></td>`;
        }
        else if(feed.data[i].type=="video"){
            output+=`<td class="messageColumn2"><a href="${feed.data[i].source}" target="_blank">Video</a></td>`
        }
        else{
            output+=`<td class="messageColumn2">${feed.data[i].message}</td>`;
        }

        output+=`
<td class="actionsColumn">${feed.data[i].insights.data[0].values[0].value}</td>
<td class="actionsColumn">${feed.data[i].likes.summary.total_count}</td>
<td class="timeColumn">${date.toDateString()} at ${date.getHours()}:${date.getMinutes()}</td>
</tr>`;
    }
    output+=`</tbody></table>`;
    document.getElementById('Page_feed').innerHTML = output; 
}

function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

function setElements(isLoggedIn){
    if(isLoggedIn){
        document.getElementById("setting_dropdown").style.display='block';
        document.getElementById("display_after_login").style.display='block';
        document.getElementById("fb-login-btn").style.display='none';
        document.getElementById("initial_window_text").style.display='none';
        document.getElementById("Nav_bar_tab").style.display='block';

    }
    else{
        document.getElementById("setting_dropdown").style.display='none';                    
        document.getElementById("display_after_login").style.display='none';
        document.getElementById("fb-login-btn").style.display='block';
        document.getElementById("initial_window_text").style.display='block';
        document.getElementById("Nav_bar_tab").style.display='none';
    }
}

function Get(url, type){
    FB.api(url, function(response){
        if(response && !response.error){
            if(type=="timeLine")
                feedBuildProfile(response);
            if(type=="page")
                feedBuildPage(response);
        } 
    });
}

function Post(url, type){

}

function logout(){
    FB.logout(function(response){
        setElements(false);
    });                
}