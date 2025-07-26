"use strict";
var vod_summary_page={
    keys:{
        index:0,
    },
    buttons:$('.vod-action-btn'),
    min_btn_index:0,
    is_loading:false,
    prev_route:'',
    init:function(prev_route){
        this.prev_route=prev_route;
        this.min_btn_index=0;
        var that=this;
        
        // Show loading states
        this.showLoadingStates();
        
        // Set basic movie info
        $('#vod-summary-name').text(current_movie.name || 'Unknown Title');
        $('#vod-watch-trailer-button').hide();
        
        // Set poster image with fallback
        var posterSrc = current_movie.stream_icon || 'images/movie_image.png';
        $('#vod-summary-image-wrapper img').attr('src', posterSrc);
        
        // Clear background image initially
        $('.vod-series-background-img').attr('src','');
        
        // Clear detailed info initially
        this.clearDetailedInfo();
        
        that.hoverButtons(1);
        if(current_movie.is_favourite){
            $(this.buttons[2]).data('action','remove')
            $(this.buttons[2]).find('.vod-series-action-btn-txt').text('Remove Favourite')
        }
        else{
            $(this.buttons[2]).data('action','add')
            $(this.buttons[2]).find('.vod-series-action-btn-txt').text('Add Favourite')
        }
        var rating=0;
        if(typeof current_movie.rating==="undefined" || current_movie.rating==="")
            rating=0;
        else
            rating=parseFloat(current_movie.rating);
        if(isNaN(rating))
            rating=0;
        $('#vod-rating-container').find('.rating-upper').css({width:rating*10+"%"});
        $('#vod-rating-mark').text(rating.toFixed(1));
        current_movie.youtube_trailer="";
        current_route="vod-summary-page";

        // Set category with better styling
        this.setCategoryInfo();
        
        // Enhanced button state management
        this.updateFavoriteButton();

        home_page.Exit();
        $('#vod-summary-page').show();
        if(settings.playlist_type==="xtreme"){
            showLoader(true);
            this.is_loading=true;
            $.getJSON(api_host_url+'/player_api.php?username='+user_name+'&password='+password+'&action=get_vod_info&vod_id='+current_movie.stream_id)
                .then(
                    function(response){
                        showLoader(false);
                        that.is_loading=false;
                        var info = response.info;
                        
                        // Use new helper method to populate detailed info
                        that.populateDetailedInfo(info);

                        // Handle trailer button visibility
                        if(typeof info.youtube_trailer!='undefined' && info.youtube_trailer!=null && info.youtube_trailer.trim()!==''){
                            that.min_btn_index=0;
                            $('#vod-watch-trailer-button').show();
                        } else {
                            that.min_btn_index=1;
                            $('#vod-watch-trailer-button').hide();
                        }
                        current_movie.youtube_trailer = response.info.youtube_trailer;
                    }
                )
                .fail(
                    function () {
                        showLoader(false);
                        that.is_loading=false;
                    }
                )
        }
    },
    goBack:function(){
        $('#vod-summary-page').hide();
        switch (this.prev_route) {
            case 'home-page':
                // $('#home-page').css({height:'100vh'});
                home_page.reEnter();
                break;
            case 'search-page':
                $('#search-page').show();
                break;
        }
        current_route=this.prev_route;
    },
    Exit:function(){
        $('#vod-summary-page').hide();
    },
    showTrailerVideo:function(){
        if(!current_movie.youtube_trailer){
            showToast("Sorry","No trailer video available")
        }
        else
            trailer_page.init(current_movie.youtube_trailer,'vod-summary-page');
    },
    showMovie:function(){
        $('#vod-summary-page').hide();
        if(!checkForAdult(current_movie,'movie',VodModel.categories))
            VodModel.addRecentOrFavouriteMovie(current_movie,'recent');  // Add To Recent Movies
        vod_series_player.makeEpisodeDoms('home-page');
        vod_series_player.init(current_movie,"movies",this.prev_route);
    },
    addFavorite:function(targetElement){
        var action=$(targetElement).data('action');
        if(action==="add"){
            current_movie.is_favourite=true;
            VodModel.addRecentOrFavouriteMovie(current_movie,'favourite');
            $(targetElement).data('action','remove');
            $(targetElement).find('.vod-series-action-btn-txt').text('Remove Favourite');
        }
        else{
            current_movie.is_favourite=false;
            VodModel.removeRecentOrFavouriteMovie(current_movie.stream_id,'favourite');
            $(targetElement).data('action','add');
            $(targetElement).find('.vod-series-action-btn-txt').text('Add Favourite');
        }
    },
    hoverButtons:function(index){
        $(this.buttons).removeClass('active');
        this.keys.index=index;
        $(this.buttons[index]).addClass('active');
    },
    keyMove:function(increment){
        var min_index=this.min_btn_index;
        var keys=this.keys;
        keys.index+=increment;
        if(keys.index<min_index)
            keys.index=2;
        if(keys.index>2)
            keys.index=min_index;
        $(this.buttons).removeClass('active');
        $(this.buttons[keys.index]).addClass('active');
    },
    handleMenuClick:function(){
        $(this.buttons[this.keys.index]).trigger('click');
    },
    HandleKey:function (e) {
        if(this.is_loading){
            if(e.keyCode===tvKey.RETURN){
                showLoader(false);
                this.is_loading=false;
                this.goBack();
            }
            return;
        }
        switch (e.keyCode) {
            case tvKey.RETURN:
                this.goBack();
                break;
            case tvKey.LEFT:
                this.keyMove(-1);
                break;
            case tvKey.RIGHT:
                this.keyMove(1);
                break;
            case tvKey.ENTER:
                this.handleMenuClick();
                break;
            case tvKey.YELLOW:
                if(!current_movie.is_favourite){
                    VodModel.addRecentOrFavouriteMovie(current_movie, 'favourite');
                    current_movie.is_favourite=true;
                }
                else{
                    VodModel.removeRecentOrFavouriteMovie(current_movie.stream_id,"favourite");
                    current_movie.is_favourite=false;
                }
                this.updateFavoriteButton();
                break;
            case tvKey.BLUE:
                this.Exit();
                goHomePageWithMovieType('series');
                break;
        }
    },
    
    showLoadingStates: function() {
        // Add loading class to elements that will be populated
        $('.vod-summary-item-text').addClass('detail-loading').text('Loading...');
        $('#vod-summary-description').addClass('detail-loading').text('Loading description...');
    },
    
    clearDetailedInfo: function() {
        $('#vod-summary-release-date').text("");
        $('#vod-summary-release-genre').text("");
        $('#vod-summary-release-length').text("");
        $('#vod-summary-release-country').text("");
        $('#vod-summary-release-director').text("");
        $('#vod-summary-release-cast').text("");
        $('#vod-summary-description').text("");
    },
    
    setCategoryInfo: function() {
        $('#current-vod-category').text('');
        var categories = VodModel.categories;
        for(var i = 0; i < categories.length; i++){
            if(categories[i].category_id == current_movie.category_id){
                $('#current-vod-category').text(categories[i].category_name);
                break;
            }
        }
        
        // If no category found, show default
        if($('#current-vod-category').text() === '') {
            $('#current-vod-category').text('Movies');
        }
    },
    
    updateFavoriteButton: function() {
        if(current_movie.is_favourite){
            $(this.buttons[2]).data('action','remove');
            $(this.buttons[2]).find('.vod-series-action-btn-txt').text('Remove Favourite');
            $(this.buttons[2]).find('i').removeClass('fa-heart-o').addClass('fa-heart');
        } else {
            $(this.buttons[2]).data('action','add');
            $(this.buttons[2]).find('.vod-series-action-btn-txt').text('Add Favourite');
            $(this.buttons[2]).find('i').removeClass('fa-heart').addClass('fa-heart-o');
        }
    },
    
    populateDetailedInfo: function(info) {
        // Remove loading states
        $('.vod-summary-item-text').removeClass('detail-loading');
        $('#vod-summary-description').removeClass('detail-loading');
        
        // Populate with actual data or fallbacks
        $('#vod-summary-release-date').text(info.releasedate || 'Unknown');
        $('#vod-summary-release-genre').text(info.genre || 'Not specified');
        $('#vod-summary-release-length').text(info.duration || 'Unknown duration');
        $('#vod-summary-release-country').text(info.country || 'Unknown');
        $('#vod-summary-release-director').text(info.director || 'Unknown');
        $('#vod-summary-release-cast').text(info.cast || 'Not available');
        $('#vod-summary-description').text(info.description || 'No description available.');
        
        // Set backdrop image if available
        try {
            var backdrop_image = info.backdrop_path && info.backdrop_path[0];
            if(backdrop_image) {
                $('.vod-series-background-img').attr('src', backdrop_image);
            }
        } catch (e) {
            console.log('Error setting backdrop image:', e);
        }
    }
}
