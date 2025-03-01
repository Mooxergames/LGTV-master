"use strict";
var login_page={
    keys:{
        focused_part:"playlist_selection",
        playlist_selection:0,
        turn_off_modal:0,
        network_issue_btn:0
    },
    network_btn_doms:$('.network-issue-btn'),
    showLoadImage:function(){
        $('#login-container .left-part-content').hide();
        $('.loader-image-container').show();
    },
    hideLoadImage:function() {
        $('.loader-image-container').hide();
        $('#login-container .left-part-content').show();
    },
    goToHomePage:function(){
        // this.hideLoadImage();
        $('#login-container').hide();
        home_page.init();
    },
    startApp:function(data){
        var today=moment().format('Y-MM-DD');
        var that=this;
        // that.hideLoadImage();
        saveData('adverts', data.adverts);
        saveData('playlist_urls',data.urls);
        saveData('youtube_playlists',data.youtube_playlists);
        saveData('youtube_api_key',data.youtube_api_key);
        console.log(data);


        var  themes=data.themes;
        saveData('themes',themes);
        var htmlContents='';
        themes.map(function(theme, index){
            htmlContents+=
                '<div class="modal-operation-menu-type-3 theme-modal-option"\
                    onclick="home_page.pickTheme('+index+')"\
                                                    onmouseenter="home_page.hoverThemeModal('+index+')"\
                                                >'+
                theme.name+
                '</div>'
        })
        $('#theme-modal-body').html(htmlContents);
        var sliderContents='';
        if(adverts.length>0){
            adverts.map(function(advert){
                sliderContents+=
                    '<div>\
                        <div style="white-space: nowrap">\
                            <div style="width: 58.3%;vertical-align: top;display: inline-block">\
                                <div class="advertise-information-container">\
                                    <h3 class="home-advert-title">'+advert.title+'</h3>\
                                            <p class="home-advert-description">'+
                    advert.description+
                    '</p>\
                </div>\
            </div>\
            <div class="home-slick-image-container">'+
                    '   <img src="'+advert.url+'">\
                                        </div>\
                                    </div>\
                                </div>';
            })
        }
        $('#home-page-slider-container').html(sliderContents);


        var bg_img_index=0;
        var bg_img_index_temp=localStorage.getItem(storage_id+'bg_img_index');
        if(bg_img_index_temp!=null)
            bg_img_index=parseInt(bg_img_index_temp);
        saveData('settings.bg_img_index', bg_img_index);
        saveData('expire_date',data.expire_date);
        saveData('is_trial', data.is_trial);
        saveData('languages',data.languages);
        saveData('lock',data.lock);
        if(data.pin_code)
            parent_account_password=data.pin_code;
        changeBackgroundImage();

        if(!data.mac_registered) {
            $('#login-play-list-information').html(
                'Your mac address is not registered yet.<br>\
                -You can activate your mac address and try 7 days free trial in <a class="login-page-link">https://flixapp.tv</a>\
                <br>-You can try with our demo playlist url without registering your playlist url.\
                &nbsp;Demo url will be valid for 7 days since you logged in first time.'
            ).show();
            that.login();
        }
        else{
            if(data.expire_date<today){
                this.hideLoadImage();
                saveData('mac_valid',false);
                if(data.is_trial==1){
                    $('#login-play-list-information').html(
                        'Your trial day is ended now, please try paid plan in <a class="login-page-link">https://flixapp.tv/activation</a>'
                    ).show();
                }
                else{
                    $('#login-play-list-information').html(
                        'Your account valid duration is ended now, please try extend expire date in <a class="login-page-link">https://flixapp.tv/activation</a>'
                    ).show();
                }
            }
            else{
                if(data.is_trial==1){  // will show tiral end message
                    $('#login-play-list-information').html(
                        'Your trial day will be ended in '+data.expire_date+', please try paid plan in <a class="login-page-link">https://flixapp.tv/activation</a>'
                    ).show();
                    that.login();
                }
                else{  // if expire date less than 7 days later, will show expire date end soon message
                    var date1=moment().add(7,'days').format('Y-MM-DD');
                    if(data.expire_date<date1)
                        $('#login-play-list-information').html(
                            'Your account valid date will be ended in '+data.expire_date+', please try extend expire date in <a class="login-page-link">https://flixapp.tv/activation</a>'
                        ).show();
                    that.login();
                }
            }
        }
    },
    fetchPlaylistInformation:function(){
        var that=this;
        $('.mac-address').text(mac_address);
        var keys=this.keys;
        var version=platform==='samsung' ? samsung_version : lg_version;
        var data={
            mac_address:mac_address,
            app_type:platform,
            version:version
        }
        var encrypted_data=encryptRequest(data);
        $.ajax({
            method: 'post',
            url: panel_url+"/device_info",
            data:{
                data:encrypted_data,
            },
            success: function (data1) {
                var data=decryptResponse(data1);
                console.log(data);
                localStorage.setItem(storage_id+'api_data',JSON.stringify(data));
                that.startApp(data);
            },
            error: function(error){
                var local_data=localStorage.getItem(storage_id+'api_data');
                if(local_data)
                    that.startApp(JSON.parse(local_data));
                else{
                    that.hideLoadImage();
                    $('#network-issue-container').show();
                    if(keys.focused_part!=='turn_off_modal')
                        that.hoverNetworkIssueBtn(0);
                }
            }
        });
    },
    getPlayListDetail:function(){
        this.network_btn_doms=$('.network-issue-btn');
        this.showLoadImage();
        $('#network-issue-container').hide();
        var that=this;
        var keys=this.keys;
        keys.focused_part="playlist_selection";
        mac_address='52:54:00:12:34:58';
        if(platform==='samsung'){
            try {
                tizen.systeminfo.getPropertyValue('ETHERNET_NETWORK', function (data) {
                    if (data !== undefined) {
                        if (typeof data.macAddress != 'undefined') {
                            mac_address = data.macAddress;
                            that.fetchPlaylistInformation();
                        } else {
                            that.hideLoadImage();
                            $('#network-issue-container').show();
                            keys.focused_part = "network_issue_btn";
                            keys.network_issue_btn = 0;
                        }
                    } else {
                        that.hideLoadImage();
                        $('#network-issue-container').show();
                        keys.focused_part = "network_issue_btn";
                        keys.network_issue_btn = 0;
                    }
                })
            }catch (e) {
                that.fetchPlaylistInformation();
            }
        }
        else if(platform==='lg'){
            webOS.service.request("luna://com.webos.service.sm", {
                method: "deviceid/getIDs",
                parameters: {
                    "idType": ["LGUDID"]
                },
                onSuccess: function (inResponse) {
                    mac_address="";
                    var temp=inResponse.idList[0].idValue.replace(/['-]+/g, '');
                    for(var i=0;i<=5;i++){
                        mac_address+=temp.substr(i*2,2);
                        if(i<5)
                            mac_address+=":";
                    }
                    that.fetchPlaylistInformation();
                },
                onFailure: function (inError) {
                    that.hideLoadImage();
                    $('#network-issue-container').show();
                    if(keys.focused_part!=='turn_off_modal')
                        keys.focused_part="network_issue_btn";
                    keys.network_issue_btn=0;
                }
            });
        }
    },
    hoverNetworkIssueBtn:function(index){
        var keys=this.keys;
        keys.focused_part='network_issue_btn';
        keys.network_issue_btn=index;
        $(this.network_btn_doms).removeClass('active');
        $(this.network_btn_doms[index]).addClass('active');
    },
    login:function(){
        var keys=this.keys;
        if(mac_valid){
            var playlist_url_index=settings.playlist_url_index;
            keys.playlist_selection=0;
            if(playlist_url_index!=null && playlist_url_index!==''){
                if(typeof playlist_urls[playlist_url_index]!="undefined"){
                    keys.playlist_selection=playlist_url_index;
                }
            }
            settings.saveSettings('playlist_url', playlist_urls[keys.playlist_selection],'');
            settings.saveSettings('playlist_url_index', keys.playlist_selection,'');
            parseM3uUrl();
            this.proceed_login();
        }
        else{
            showToast("Sorry","You can not use our service now, please extend your expire date by paying us")
        }
    },
    convertXtremeToM3u:function(){
        settings.playlist_type="type1";
        api_host_url=settings.playlist_url;
        this.proceed_login();
    },
    goHomePageWithPlaylistError:function (){
        LiveModel.setCategories([]);
        VodModel.setCategories([]);
        SeriesModel.setCategories([]);
        LiveModel.setMovies([]);
        VodModel.setMovies([]);
        SeriesModel.setMovies([]);
        LiveModel.insertMoviesToCategories();
        VodModel.insertMoviesToCategories();
        SeriesModel.insertMoviesToCategories();

        playlist_succeed=false;
        $('#turn-off-modal').modal('hide');
        $('#playlist-error').show();
        // this.hideLoadImage();
        this.goToHomePage();
        if(platform==='samsung')
            home_page.hoverToMainMenu(6);
        else
            home_page.hoverToMainMenu(5);
        home_page.handleMenuClick();
        home_page.hoverSettingModal(5);
        home_page.handleMenuClick();
    },
    proceed_login:function(){
        $('#playlist-error').hide();
        playlist_succeed=true;
        var that=this;
        this.showLoadImage();
        var playlist_type=settings.playlist_type;
        var client_offset = moment(new Date()).utcOffset();
        if(playlist_type==="xtreme"){
            var  prefix_url=api_host_url+'/player_api.php?username='+user_name+'&password='+password+'&action=';
            var login_url=prefix_url.replace("&action=","");
            $.ajax({
                method:'get',
                url:login_url,
                success:function (data) {
                    if(typeof  data.user_info!="undefined")
                    {
                        saveData('user_info', data.user_info);
                        if(data.user_info.auth==0 || (typeof data.user_info.status!='undefined' && data.user_info.status==='Expired')){
                            that.hideLoadImage();
                            $('#login-page-error-playlists-container').show();
                            that.keys.focused_part="playlist_selection";
                        }else{
                            $.when(
                                $.ajax({
                                    method:'get',
                                    url:prefix_url+'get_live_streams',
                                    success:function (data) {
                                        LiveModel.setMovies(data);
                                    },
                                    error:function(error){
                                        // that.hideLoadImage();
                                    }
                                }),
                                $.ajax({
                                    method:'get',
                                    url:prefix_url+'get_live_categories',
                                    success:function (data) {
                                        LiveModel.setCategories(data);
                                    },
                                    error:function(error){
                                        // that.hideLoadImage();
                                    }
                                }),
                                $.ajax({
                                    method:'get',
                                    url:prefix_url+'get_vod_categories',
                                    success:function (data) {
                                        VodModel.setCategories(data);
                                    },
                                    error:function(error){
                                    }
                                }),
                                $.ajax({
                                    method:'get',
                                    url:prefix_url+'get_series_categories',
                                    success:function (data) {
                                        SeriesModel.setCategories(data);
                                        SeriesModel.movie_key="series_id";
                                    },
                                    error:function(error){
                                    }
                                }),
                                $.ajax({
                                    method:'get',
                                    url:prefix_url+'get_vod_streams',
                                    success:function (data) {
                                        VodModel.setMovies(data);
                                    },
                                    error:function(error){

                                    }
                                }),
                                $.ajax({
                                    method:'get',
                                    url:prefix_url+'get_series',
                                    success:function (data) {
                                        SeriesModel.setMovies(data);
                                    },
                                    error:function(error){
                                    }
                                })
                            ).then(function () {
                                LiveModel.insertMoviesToCategories();
                                VodModel.insertMoviesToCategories();
                                SeriesModel.insertMoviesToCategories();
                                $('#turn-off-modal').modal('hide');
                                // that.hideLoadImage();
                                that.goToHomePage();
                            }).fail(function (error) {
                                settings.playlist_type="type1";
                                api_host_url=settings.playlist_url;
                                console.log(error,"convert to normal m3u");
                                that.proceed_login();
                                return;
                            })
                        }
                    }else{
                        that.convertXtremeToM3u();
                    }
                    if(typeof  data.server_info!="undefined"){
                        saveData('server_info',data.server_info)
                        calculateTimeDifference(data.server_info.time_now,data.server_info.timestamp_now)
                    }
                },
                error:function(error){
                    that.convertXtremeToM3u();
                }
            })
        }
        else if(playlist_type==='type1'){
            $.when(
                $.ajax({
                    method:'get',
                    url:api_host_url,
                    success:function (data) {
                        parseM3uResponse("type1",data)
                    },
                    error:function(error){

                    },
                    timeout:50000
                })
            ).then(function () {
                // that.hideLoadImage();
                that.goToHomePage();

            }).fail(function () {
                // that.hideLoadImage();
                // $('#login-page-error-playlists-container').show();
                // if(that.keys.focused_part!=='turn_off_modal')
                //     that.keys.focused_part="playlist_selection";
                that.goHomePageWithPlaylistError();
            })
        }
    },
    handleMenuClick:function(){
        var keys=this.keys;
        if(keys.focused_part==="playlist_selection"){
            if(mac_valid){
                settings.saveSettings('playlist_url', playlist_urls[keys.playlist_selection],'');
                settings.saveSettings('playlist_url_index', keys.playlist_selection,'');
                parseM3uUrl();
                this.proceed_login();
            }
            else {
                showToast("Sorry","You can not use our service now, please activate your device at https://flixapp.tv/activation and restart your app");
            }
        }
        else if(keys.focused_part==="turn_off_modal"){
            if(keys.turn_off_modal==0){
                $('#turn-off-modal').modal('hide');
                closeApp();
            }
            else{
                $('#turn-off-modal').modal('hide');
                var network_display=$('#network-issue-container').css('display');
                if(network_display!=='block')
                    this.keys.focused_part="playlist_selection";
                else
                    this.keys.focused_part="network_issue_btn";
            }
        }
        else if(keys.focused_part==="network_issue_btn"){
            $(this.network_btn_doms[keys.network_issue_btn]).trigger('click');
        }
    },
    handleMenuUpDown:function(increment){
        var keys=this.keys;
        if(keys.focused_part==="playlist_selection"){
        }

    },
    handleMenuLeftRight:function(increment){
        var keys=this.keys;
        if(keys.focused_part==="network_issue_btn"){
            keys.network_issue_btn+=increment;
            if(keys.network_issue_btn<0)
                keys.network_issue_btn=0;
            else if(keys.network_issue_btn>=this.network_btn_doms.length)
                keys.network_issue_btn=this.network_btn_doms.length-1;
            $(this.network_btn_doms).removeClass('active');
            $(this.network_btn_doms[keys.network_issue_btn]).addClass('active');
        }
        if(keys.focused_part==="turn_off_modal"){
            keys.turn_off_modal+=increment;
            var buttons=$('#turn-off-modal').find('button');
            if(keys.turn_off_modal<0)
                keys.turn_off_modal=1;
            if(keys.turn_off_modal>1)
                keys.turn_off_modal=0;
            $(buttons).removeClass('active');
            $(buttons[keys.turn_off_modal]).addClass('active');
        }
    },
    HandleKey:function(e) {
        switch(e.keyCode){
            case tvKey.DOWN:
                this.handleMenuUpDown(1);
                break;
            case tvKey.UP:
                this.handleMenuUpDown(-1);
                break;
            case tvKey.LEFT:
                this.handleMenuLeftRight(-1);
                break;
            case tvKey.RIGHT:
                this.handleMenuLeftRight(1);
                break;
            case tvKey.ENTER:
                this.handleMenuClick();
                break;
            case tvKey.RETURN:
                if(this.keys.focused_part==="playlist_selection" || this.keys.focused_part==="network_issue_btn"){
                    $('#turn-off-modal').modal('show');
                    this.keys.focused_part="turn_off_modal";
                    this.keys.turn_off_modal=0;
                    var buttons=$('#turn-off-modal').find('button');
                    $(buttons).removeClass('active');
                    $(buttons[0]).addClass('active');
                }
                else if(this.keys.focused_part==="turn_off_modal"){
                    $('#turn-off-modal').modal('hide');
                    var network_display=$('#network-issue-container').css('display');
                    if(network_display!=='block')
                        this.keys.focused_part="playlist_selection";
                    else
                        this.keys.focused_part="network_issue_btn";
                }
                break;
        }
    }
}
