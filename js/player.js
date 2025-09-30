"use strict";
var media_player;
function initPlayer() {
    if(platform==='samsung'){
        media_player={
            videoObj:null,
            parent_id:'',
            STATES:{
                STOPPED: 0,
                PLAYING: 1,
                PAUSED: 2,
                PREPARED: 4
            },
            current_time:0,
            full_screen_state:0,
            reconnect_timer: null,
            reconnect_count: 0,
            reconnect_max_count: 20,
            url:'',
            id:'',
            uhd_checked: false,
            init:function(id, parent_id) {
                this.id=id;
                this.parent_id=parent_id;
                this.STATES={
                    STOPPED: 0,
                    PLAYING: 1,
                    PAUSED: 2,
                    PREPARED: 4
                };
                this.state = this.STATES.STOPPED;
                this.parent_id=parent_id;
                this.current_time=0;
                this.videoObj = document.getElementById(id);
                $('#'+parent_id).find('.subtitle-container').hide();
                $('#' + parent_id).find('.video-reconnect-message').hide();
                this.full_screen_state=0;
                try{
                    webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');
                }catch (e) {
                }
                $('.video-resolution').text('Live');
                this.reconnect_count = 0;
                
                // Check 4K support once at startup
                if(!this.uhd_checked) {
                    this.check4KSupport();
                    this.uhd_checked = true;
                }
            },
            check4KSupport: function() {
                console.log("Checking 4K support...");
                try {
                    if(typeof webapis !== 'undefined' && webapis.productinfo) {
                        if(webapis.productinfo.isUdPanelSupported()) {
                            console.log("✓ 4K UHD is supported");
                        } else {
                            console.log("✗ 4K UHD is not supported");
                        }
                    } else {
                        console.log("⚠ Not on Samsung TV - 4K check skipped");
                    }
                } catch(e) {
                    console.log("⚠ 4K check failed:", e.message);
                }
            },
            playAsync:function(url){
                console.log(url);
                this.url=url;
                $('#'+this.parent_id).find('.video-error').hide();

                $('.video-loader').show();
                if (this.state > this.STATES.STOPPED) {
                    return;
                }
                if (!this.videoObj) {
                    return 0;
                }
                var that=this;
                try{
                    webapis.avplay.open(url);
                    this.setupEventListeners();
                    this.setDisplayArea();
                    // webapis.avplay.setBufferingParam("PLAYER_BUFFER_FOR_PLAY","PLAYER_BUFFER_SIZE_IN_BYTE", 1000); // 5 is in seconds
                    // webapis.avplay.setBufferingParam("PLAYER_BUFFER_FOR_PLAY","PLAYER_BUFFER_SIZE_IN_SECOND", 4); // 5 is in seconds

                    webapis.avplay.prepareAsync(
                        function(){
                            that.reconnect_count = 0;
                            $('#' + that.parent_id).find('.video-reconnect-message').hide();
                            $('#'+that.parent_id).find('.video-error').hide();
                            $('#'+that.parent_id).find('.video-loader').hide();
                            that.state = that.STATES.PLAYING;
                            webapis.avplay.play();
                            try{
                                that.full_screen_state=1;
                                // Keep AUTO_ASPECT_RATIO for consistent aspect ratio handling
                                // webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
                            }catch (e) {
                            }
                            $('#'+that.parent_id).find('.video-total-time').text(that.formatTime(webapis.avplay.getDuration()/1000));
                            $('#'+that.parent_id).find('.video-error').hide();
                            $('#'+that.parent_id).find('.progress-amount').css({width:0})
                            var attributes={
                                min: 0,
                                max:webapis.avplay.getDuration()/1000
                            };
                            $('#'+that.parent_id).find('.video-progress-bar-slider').attr(attributes)
                            $('#'+that.parent_id).find('.video-progress-bar-slider').rangeslider('update', true);
                            $('#'+that.parent_id).find('.video-current-time').text("00:00");
                            if(current_route==='vod-series-player-video')
                                vod_series_player.showResumeBar();
                            if(current_route==='channel-page'){
                                try{
                                    var stream_info=webapis.avplay.getCurrentStreamInfo();
                                    if(typeof stream_info[0]!='undefined'){
                                        var extra_info=JSON.parse(stream_info[0].extra_info);
                                        // Only update if both width and height are valid
                                        if(extra_info && typeof extra_info.Width !== 'undefined' && typeof extra_info.Height !== 'undefined' && 
                                           extra_info.Width !== null && extra_info.Height !== null) {
                                            var stream_summary=extra_info.Width+' * '+extra_info.Height;
                                            $('.video-resolution').text(stream_summary);
                                        }
                                        // If Samsung API values are invalid, don't override the existing resolution display
                                    }
                                }catch (e) {
                                    // Samsung API failed, keep existing resolution display unchanged
                                }
                            }
                        },
                        function(e){
                            console.log('video loading failed',e);
                            $('.video-loader').hide();
                            $('#'+that.parent_id).find('.video-error').show();
                            if (that.reconnect_count < that.reconnect_max_count)
                                that.tryReconnect();
                        }
                    );
                }catch(e){
                    console.log('video loading failed',e);
                    $('.video-loader').hide();
                    $('#'+that.parent_id).find('.video-error').show();
                    if (that.reconnect_count < that.reconnect_max_count)
                        that.tryReconnect();
                }
                // console.log((new Date).getTime()/1000);
            },
            play:function(){
                if (this.state === this.STATES.STOPPED) {
                    return this.playAsync(this.url)
                }

                this.state=this.STATES.PLAYING;
                try{
                    webapis.avplay.play();
                }catch(e){
                    console.log(e);
                }
            },
            pause:function() {
                this.state = this.STATES.PAUSED;
                try{
                    webapis.avplay.pause();
                }catch(e){
                    console.log(e);
                }
            },
            stop:function() {
                this.state = this.STATES.STOPPED;
                try{
                    webapis.avplay.stop();
                }catch (e) {
                }
                this.reconnect_count = 0;
                clearTimeout(this.reconnect_timer);
                $('#' + this.parent_id).find('.video-reconnect-message').hide();
                SrtOperation.deStruct();
                this.subtitles=[];
            },
            close:function(){
                this.state = this.STATES.STOPPED;
                try{
                    webapis.avplay.close();
                }catch (e) {
                }
                $(this.parent_id).find('.video-error').hide();
                this.reconnect_count = 0;
                clearTimeout(this.reconnect_timer);
                $('#' + this.parent_id).find('.video-reconnect-message').hide();
                SrtOperation.deStruct();
                this.subtitles=[];
            },
            tryReconnect: function () {
                if (current_route !== 'channel-page' && !(current_route=='home-page' && home_page.current_preview_type==='live'))
                    return;
                clearTimeout(this.reconnect_timer);
                var reconnect_count=this.reconnect_count + 1;
                if (reconnect_count >= this.reconnect_max_count) {
                    $('#' + this.parent_id).find('.video-reconnect-message').hide();
                    return;
                }
                $('#' + this.parent_id).find('.video-reconnect-message').show();
                var that = this;
                try{
                    media_player.close();
                }catch (e) {
                }
                this.reconnect_count = reconnect_count;
                this.reconnect_timer = setTimeout(function () {
                    that.playAsync(that.url);
                }, 4000)
            },
            setDisplayArea:function() {
                var top_position=$(this.videoObj).offset().top;
                var left_position=$(this.videoObj).offset().left;
                var width=parseInt($(this.videoObj).width())
                var height=parseInt($(this.videoObj).height());
                console.log(top_position,left_position,width,height);
                // console.log(this.videoObj);
                webapis.avplay.setDisplayRect(left_position,top_position,width,height);

                channel_page.toggleFavoriteAndRecentBottomOptionVisbility();
            },
            // Aspect ratio cycling system
            aspect_ratio_modes: {
                samsung: [
                    'PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO',
                    'PLAYER_DISPLAY_MODE_LETTER_BOX', 
                    'PLAYER_DISPLAY_MODE_FULL_SCREEN'
                ],
                lg: [
                    'contain',  // Letterbox equivalent
                    'cover',    // Fill/zoom to cover
                    'fill'      // Stretch to fill
                ]
            },
            current_aspect_ratio_index: 0,
            
            toggleScreenRatio:function(){
                try{
                    if(platform === 'samsung'){
                        // Cycle through Samsung display modes
                        var modes = this.aspect_ratio_modes.samsung;
                        this.current_aspect_ratio_index = (this.current_aspect_ratio_index + 1) % modes.length;
                        var selectedMode = modes[this.current_aspect_ratio_index];
                        
                        webapis.avplay.setDisplayMethod(selectedMode);
                        
                    } else if(platform === 'lg'){
                        // Cycle through LG CSS object-fit modes
                        var modes = this.aspect_ratio_modes.lg;
                        this.current_aspect_ratio_index = (this.current_aspect_ratio_index + 1) % modes.length;
                        var selectedMode = modes[this.current_aspect_ratio_index];
                        
                        // Apply CSS object-fit to video element
                        $(this.videoObj).css('object-fit', selectedMode);
                    }
                }catch (e) {
                    console.log('Aspect ratio change failed:', e);
                }
            },
            formatTime:function(seconds) {
                var hh = Math.floor(seconds / 3600),
                    mm = Math.floor(seconds / 60) % 60,
                    ss = Math.floor(seconds) % 60;
                return (hh ? (hh < 10 ? "0" : "") + hh + ":" : "") +
                    ((mm < 10) ? "0" : "") + mm + ":" +
                    ((ss < 10) ? "0" : "") + ss;
            },
            setupEventListeners:function() {
                var that = this;
                var listener = {
                    onbufferingstart: function() {
                        $('#'+that.parent_id).find('.video-loader').show();
                        // console.log("Buffereing Start time "+(new Date()).getTime()/1000)
                    },
                    onbufferingprogress: function(percent) {
                        // console.log("Buffering progress: "+percent);
                    },
                    onbufferingcomplete: function() {
                        $('#'+that.parent_id).find('.video-loader').hide();
                        // Reapply display area after buffering for proper sizing
                        setTimeout(function() {
                            that.setDisplayArea();
                        }, 100);
                        // console.log('Buffering Complete, Can play now!');
                        // console.log("Buffereing complete time "+(new Date()).getTime()/1000)
                    },
                    onstreamcompleted: function() {
                        // console.log('video has ended.');
                        $('#'+that.parent_id).find('.video-error').hide();
                        webapis.avplay.stop();
                        that.state = that.STATES.STOPPED;
                        $('#'+that.parent_id).find('.progress-amount').css({width:'100%'})
                        if(current_route==='vod-series-player-video'){
                            vod_series_player.showNextVideo(1);
                        }
                    },
                    oncurrentplaytime: function(currentTime) {
                        that.current_time=currentTime;
                        var currentTimeSeconds = currentTime/1000;
                        
                        
                        if(current_route==='vod-series-player-video') {
                            vod_series_player.current_time=currentTimeSeconds;
                            // Samsung subtitle timing - convert ms to seconds
                            if(typeof SrtOperation !== 'undefined') {
                                SrtOperation.timeChange(currentTimeSeconds);
                            }
                        }
                        $('#'+that.parent_id).find('.video-error').hide();
                        var duration =  webapis.avplay.getDuration();
                        if (duration > 0) {
                            $('#'+that.parent_id).find('.video-progress-bar-slider').val(currentTime/1000).change();
                            $('#'+that.parent_id).find('.video-current-time').html(that.formatTime(currentTime/1000));
                            $('#'+that.parent_id).find('.progress-amount').css({width:currentTime/duration*100+'%'});
                        }
                    },
                    ondrmevent: function(drmEvent, drmData) {
                        // console.log("DRM callback: " + drmEvent + ", data: " + drmData);
                    },
                    onerror : function(type, data) {
                        $('#' + that.parent_id).find('.video-error').show();
                        if (that.reconnect_count < that.reconnect_max_count)
                            that.tryReconnect();
                    },
                    onsubtitlechange: function(duration, text, data3, data4) {
                        $('#'+that.parent_id).find('.subtitle-container').html("");
                        $('#'+that.parent_id).find('.subtitle-container').html(text);
                        // console.log($('#'+that.parent_id).find('.subtitle-container'));
                        // console.log(that.parent_id,"subtitleText: ",text,data3,data4);
                    }
                }
                webapis.avplay.setListener(listener);
            },
            onDeviceReady:function() {
                document.addEventListener('pause', media_player.onPause);
                document.addEventListener('resume', media_player.onResume);
            },
            onPause:function() {
                this.pause();
            },
            onResume:function() {
                this.play();
            },
            getSubtitleOrAudioTrack:function(kind){
                var result=[];
                // result=[
                //     {
                //         extra_info:{
                //             fourCC: "un",
                //             subtitle_type: "0",
                //             track_lang: "un",
                //             index: 3,
                //             type: "TEXT"
                //         }
                //     }
                // ]
                // return result;
                var all_track_str="";
                var key=kind==="TEXT" ? "track_lang" : "language";
                var default_track_text=kind==="TEXT" ? "Subtitle " : "Audio Track ";
                try{
                    var totalTrackInfo=webapis.avplay.getTotalTrackInfo();
                    console.log(kind, totalTrackInfo);
                    for(var i=0; i<totalTrackInfo.length;i++)
                    {
                        try{
                            if(totalTrackInfo[i].type == kind){
                                var extra_info=JSON.parse(totalTrackInfo[i].extra_info);
                                if(kind==='TEXT' || kind==='AUDIO'){
                                    var language=extra_info[key].trim();
                                    var lower_language=language.toLowerCase();
                                    if(!all_track_str.includes(language) && language!=='' && lower_language!='und' && lower_language!='undefined' && lower_language!='undetermined'){
                                        all_track_str+=(", "+language);
                                        extra_info[key]=typeof language_codes[language]!="undefined" ? language_codes[language] : language;
                                        totalTrackInfo[i].extra_info=extra_info;
                                        result.push(totalTrackInfo[i]);
                                    }
                                    else if(language=='' || lower_language=='und' || lower_language=='undefined' || lower_language=='undetermined'){
                                        extra_info[key]=default_track_text+(i+1);
                                        totalTrackInfo[i].extra_info=extra_info;
                                        result.push(totalTrackInfo[i]);
                                    }
                                }else{
                                    totalTrackInfo[i].extra_info=extra_info;
                                    result.push(totalTrackInfo[i]);
                                }
                            }
                        }catch (e) {
                            console.log(kind, e);
                        }
                    }
                    // console.log(kind, result);
                }catch (e) {

                }
                console.log(result);
                return result;
            },
            setSubtitleOrAudioTrack:function(kind, index){
                // Enhanced Samsung subtitle control from exo app
                try{
                    if(kind === "TEXT") {
                        if(index === -1) {
                            // Disable native subtitles - check if webapis is available
                            if(typeof webapis !== 'undefined' && webapis.avplay && webapis.avplay.setSubtitle) {
                                webapis.avplay.setSubtitle(-1);
                            }
                        } else {
                            // Enable native subtitle track - check if webapis is available
                            if(typeof webapis !== 'undefined' && webapis.avplay) {
                                if(webapis.avplay.setSilentSubtitle) {
                                    webapis.avplay.setSilentSubtitle(true);
                                }
                                if(webapis.avplay.setSelectTrack) {
                                    webapis.avplay.setSelectTrack(kind, index);
                                }
                                if(webapis.avplay.setSilentSubtitle) {
                                    webapis.avplay.setSilentSubtitle(false);
                                }
                            }
                        }
                        
                        if(index > -1) {
                            $('#'+this.parent_id).find('.subtitle-container').show();
                        }
                    } else {
                        // Audio track handling - check if webapis is available
                        if(typeof webapis !== 'undefined' && webapis.avplay && webapis.avplay.setSelectTrack) {
                            webapis.avplay.setSelectTrack(kind, index);
                        }
                    }
                }catch (e) {
                    console.error('Samsung subtitle/audio track error:', e.message || e);
                    console.error('Error details:', e);
                }
            },
            seekTo:function(step){
                var current_page_variable;
                if(current_route==='epg-page')
                    current_page_variable=epg_page;
                if(current_page_variable.current_time===0)
                    current_page_variable.current_time=this.current_time/1000;
                var duration=webapis.avplay.getDuration()/1000;
                var newTime = current_page_variable.current_time + step;
                if(newTime<0)
                    newTime=0;
                if(newTime>=duration)
                    newTime=duration;
                current_page_variable.current_time=newTime;

                webapis.avplay.seekTo(newTime*1000);
                if (duration > 0) {
                    $('#'+this.parent_id).find('.video-progress-bar-slider').val(newTime).change();
                    $('#'+this.parent_id).find('.video-current-time').html(this.formatTime(newTime));
                }
            }
        }
    }
    else if(platform==='lg'){
        media_player={
            id:'',
            videoObj:null,
            parent_id:'',
            current_time:0,
            STATES:{
                STOPPED: 0,
                PLAYING: 1,
                PAUSED: 2,
                PREPARED: 4
            },
            next_video_timer:false,
            next_video_showing:false,
            subtitles:[],
            tracks:[],
            init:function(id, parent_id) {
                id+='-lg';
                this.next_video_showing=false;
                clearTimeout(this.next_video_timer);
                this.id=id;
                this.videoObj=null;     // tag video
                this.parent_id=parent_id;
                this.current_time=0;
                this.state = this.STATES.STOPPED;
                $('#'+this.parent_id).find('.video-loader').show();
                this.subtitles=[];
                this.tracks=[];
                SrtOperation.deStruct();

                this.videoObj = document.getElementById(id);
                var videoObj=this.videoObj;
                var that=this;
                this.videoObj.addEventListener("error", function(e) {
                    console.log('error',e);
                    $('#'+that.parent_id).find('.video-loader').show();
                    $('#'+that.parent_id).find('.video-error').show();
                });
                this.videoObj.addEventListener("canplay", function(e) {
                    console.log("Can play")
                    $('#'+that.parent_id).find('.video-error').hide();
                    // console.log('Video can start, but not sure it will play through.');
                });
                this.videoObj.addEventListener('playing', function(event){
                    // Video is playing after buffering
                });
                this.videoObj.addEventListener('durationchange', function(event){
                    $('#'+that.parent_id).find('.video-error').hide();
                    // console.log('Not sure why, but the duration of the video has changed.');
                });
                this.videoObj.addEventListener('loadeddata', function(event){
                    var duration=parseInt(videoObj.duration);
                    var attributes={
                        min: 0,
                        max:duration,
                    };
                    $('#'+that.parent_id).find('.video-loader').hide();
                    $('#'+that.parent_id).find('.video-progress-bar-slider').attr(attributes)
                    $('#'+that.parent_id).find('.video-progress-bar-slider').rangeslider('update', true);
                    if(current_route==='vod-series-player-video'){
                        vod_series_player.showResumeBar();
                    }
                });
                this.videoObj.ontimeupdate = function(event){
                    $('#'+that.parent_id).find('.video-error').hide();
                    var duration =  videoObj.duration;
                    var currentTime=videoObj.currentTime;
                    
                    
                    if(current_route==='vod-series-player-video') {
                        // Use same seconds logic as Samsung - store original time
                        that.current_time=currentTime;
                        vod_series_player.current_time=currentTime;
                        
                        // LG subtitle timing - same logic as Samsung (already in seconds)
                        if(typeof SrtOperation !== 'undefined') {
                            SrtOperation.timeChange(currentTime);
                        }
                    }
                    if (duration > 0) {
                        $('#'+that.parent_id).find('.video-progress-bar-slider').val(currentTime).change();
                        $('#'+that.parent_id).find('.video-current-time').html(that.formatTime(currentTime));
                        $('#'+that.parent_id).find('.progress-amount').css({width:currentTime/duration*100+'%'});
                    }
                };
                this.videoObj.addEventListener('loadedmetadata', function() {
                    var duration=parseInt(videoObj.duration);
                    var attributes={
                        min: 0,
                        max:duration,
                    };
                    $('#'+that.parent_id).find('.video-total-time').text(that.formatTime(duration));
                    $('#'+that.parent_id).find('.video-progress-bar-slider').attr(attributes)
                    $('#'+that.parent_id).find('.video-progress-bar-slider').rangeslider('update', true);
                });
                this.videoObj.addEventListener('waiting', function(event){
                    // console.log('Video is waiting for more data.',event);
                });
                this.videoObj.addEventListener('suspend', function(event){
                    // console.log('Data loading has been suspended.');
                    // $('#'+this.parent_id).find('.video-error').show();
                });
                this.videoObj.addEventListener('stalled', function(event){
                    console.log('Failed to fetch data, but trying.');
                    // $('#'+this.parent_id).find('.video-error').show();
                });
                this.videoObj.addEventListener('ended', function(event){
                    // console.log("\n\n\n",'video duration='+that.videoObj.duration);
                    if(current_route==='vod-series-player-video'){
                        if(that.videoObj.duration>0 && !isNaN(that.videoObj.duration))
                            vod_series_player.showNextVideo(1);
                    }
                });
                // this.videoObj.addEventListener('emptied', function(event){
                //     console.log('Uh oh. The media is empty. Did you call load()?');
                //     $('#'+this.parent_id).find('.video-error').show();
                // });
            },
            playAsync:function(url){
                console.log(url);
                if(url){
                    try{
                        this.videoObj.pause();
                    }catch (e) {

                    }
                    var that=this;
                    $('#'+this.parent_id).find('.video-error').hide();
                    $('#'+this.parent_id).find('.video-loader').show();
                    while (this.videoObj.firstChild)
                        this.videoObj.removeChild(this.videoObj.firstChild);
                    this.videoObj.load();
                    var source = document.createElement("source");
                    source.setAttribute('src',url);
                    this.videoObj.appendChild(source);
                    this.videoObj.play();
                    $('#'+this.parent_id).find('.progress-amount').css({width:0})

                    source.addEventListener("error", function(e) {
                        $('#'+that.parent_id).find('.video-error').show();
                    });
                }
                this.state=this.STATES.PLAYING;
            },
            play:function(){
                this.state=this.STATES.PLAYING;
                try{
                    this.videoObj.play();
                }catch(e){
                    console.log(e);
                }
                if(SrtOperation.srt.length>0)  // if has subtitles
                    SrtOperation.stopped=false;
            },
            pause:function() {
                this.state = this.STATES.PAUSED;
                try{
                    this.videoObj.pause();
                }catch (e) {
                }
            },
            stop:function() {
                try{
                    this.videoObj.pause();
                }catch (e) {
                }
                SrtOperation.deStruct();
                this.subtitles=[];
            },
            close:function(){
                try{
                    this.videoObj.pause();
                }catch (e) {
                }
                SrtOperation.deStruct();
                this.subtitles=[];
            },
            // LG TV aspect ratio cycling (uses same system as Samsung player)
            aspect_ratio_modes: {
                lg: ['contain', 'cover', 'fill']
            },
            current_aspect_ratio_index: 0,
            
            toggleScreenRatio:function(){
                try{
                    // Cycle through LG CSS object-fit modes
                    var modes = this.aspect_ratio_modes.lg;
                    this.current_aspect_ratio_index = (this.current_aspect_ratio_index + 1) % modes.length;
                    var selectedMode = modes[this.current_aspect_ratio_index];
                    
                    // Apply CSS object-fit to video element
                    $(this.videoObj).css('object-fit', selectedMode);
                    
                }catch (e) {
                    console.log('LG aspect ratio change failed:', e);
                }
            },
            setDisplayArea:function(){
                channel_page.toggleFavoriteAndRecentBottomOptionVisbility();
            },
            formatTime:function(seconds) {
                var hh = Math.floor(seconds / 3600),
                    mm = Math.floor(seconds / 60) % 60,
                    ss = Math.floor(seconds) % 60;
                return (hh ? (hh < 10 ? "0" : "") + hh + ":" : "") +
                    ((mm < 10) ? "0" : "") + mm + ":" +
                    ((ss < 10) ? "0" : "") + ss;
            },
            seekTo:function(seekTime){

            },
            getSubtitleOrAudioTrack:function(kind){
                var totalTrackInfo=[],temps;
                if(kind=="TEXT"){
                    temps=media_player.videoObj.textTracks.length > 0 ? media_player.videoObj.textTracks : {};
                }else
                    temps=media_player.videoObj.audioTracks.length>0 ? media_player.videoObj.audioTracks : {};
                console.log(temps);
                if(Object.keys(temps).length>0){
                    Object.keys(temps).map(function (key,index) {
                        if(typeof temps[key]=='object' && temps[key]!=null)
                            totalTrackInfo.push(temps[key]);
                    })
                }
                console.log(totalTrackInfo);
                return totalTrackInfo;
            },
            setSubtitleOrAudioTrack:function(kind, index){
                // Enhanced LG subtitle control from exo app
                try {
                    if(kind === "TEXT" && this.videoObj.textTracks) {
                        // Disable all text tracks first
                        for(var i = 0; i < this.videoObj.textTracks.length; i++) {
                            this.videoObj.textTracks[i].mode = 'hidden';
                        }
                        
                        // Enable selected track
                        if(index >= 0 && index < this.videoObj.textTracks.length) {
                            this.videoObj.textTracks[index].mode = 'showing';
                        }
                        
                        // Handle API subtitles
                        if(this.subtitles[index]) {
                            SrtOperation.init(this.subtitles[index], this.videoObj.currentTime);
                        }
                    } else if(kind === "AUDIO") {
                        // Audio track handling
                        for (var i = 0; i < this.videoObj.audioTracks.length; i++) {
                            this.videoObj.audioTracks[i].enabled = false;
                        }
                        if(index >= 0 && index < this.videoObj.audioTracks.length) {
                            this.videoObj.audioTracks[index].enabled = true;
                        }
                    }
                } catch(e) {
                    console.error('LG subtitle/audio track error:', e);
                }
            }
        }
    }
}
