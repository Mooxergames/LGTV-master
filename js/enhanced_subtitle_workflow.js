"use strict";

/**
 * Enhanced Subtitle Workflow Integration
 * Combines API fetching with native subtitle fallback
 */
var EnhancedSubtitleWorkflow = {
    
    /**
     * Initialize enhanced subtitle system for movies or episodes
     * @param {Object} movieData - Movie or episode data
     * @param {string} movieType - 'movie' or 'episode' 
     * @param {Function} successCallback - Called when subtitles are ready
     * @param {Function} errorCallback - Called on error
     */
    initializeSubtitles: function(movieData, movieType, successCallback, errorCallback) {
        var that = this;
        
        console.log('Initializing enhanced subtitles for:', movieData.name, 'Type:', movieType);
        
        // Step 1: Fetch API subtitles first
        SubtitleFetcher.fetchSubtitles(movieData, movieType, 
            function(apiSubtitles) {
                // API subtitles found
                console.log('API subtitles found:', apiSubtitles.length);
                that.setupSubtitleMenu(apiSubtitles, movieData, successCallback);
            },
            function(error) {
                // API failed, fallback to native subtitles
                console.log('API subtitles failed, using native fallback:', error);
                that.useNativeSubtitleFallback(movieData, successCallback, errorCallback);
            }
        );
    },
    
    /**
     * Setup subtitle menu with API and native subtitles combined
     * @param {Array} apiSubtitles - Subtitles from API
     * @param {Object} movieData - Movie data
     * @param {Function} successCallback - Success callback
     */
    setupSubtitleMenu: function(apiSubtitles, movieData, successCallback) {
        // Get native subtitles as fallback
        var nativeSubtitles = SubtitleFetcher.getNativeSubtitles();
        
        // Combine API and native subtitles
        var combinedSubtitles = SubtitleFetcher.combineSubtitles(apiSubtitles, nativeSubtitles);
        
        // Store in media player for access
        if(typeof media_player !== 'undefined') {
            media_player.subtitles = combinedSubtitles;
        }
        
        console.log('Combined subtitles available:', combinedSubtitles.length);
        
        if(successCallback) {
            successCallback(combinedSubtitles);
        }
    },
    
    /**
     * Fallback to native subtitles when API fails
     * @param {Object} movieData - Movie data  
     * @param {Function} successCallback - Success callback
     * @param {Function} errorCallback - Error callback
     */
    useNativeSubtitleFallback: function(movieData, successCallback, errorCallback) {
        var nativeSubtitles = SubtitleFetcher.getNativeSubtitles();
        
        if(nativeSubtitles.length > 0) {
            console.log('Using native subtitle fallback:', nativeSubtitles.length);
            
            // Add "Off" option
            var fallbackSubtitles = [{
                source: 'off',
                label: 'Off',
                language: 'none'
            }].concat(nativeSubtitles);
            
            // Store in media player
            if(typeof media_player !== 'undefined') {
                media_player.subtitles = fallbackSubtitles;
            }
            
            if(successCallback) {
                successCallback(fallbackSubtitles);
            }
        } else {
            console.log('No subtitles available (API and native both failed)');
            if(errorCallback) {
                errorCallback('No subtitles available');
            }
        }
    },
    
    /**
     * Handle subtitle selection from user
     * @param {number} selectedIndex - Index of selected subtitle
     * @param {Function} loadingCallback - Called when loading starts
     * @param {Function} successCallback - Called when subtitle is loaded
     * @param {Function} errorCallback - Called on error
     */
    selectSubtitle: function(selectedIndex, loadingCallback, successCallback, errorCallback) {
        if(!media_player || !media_player.subtitles || selectedIndex >= media_player.subtitles.length) {
            if(errorCallback) errorCallback('Invalid subtitle selection');
            return;
        }
        
        var selectedSubtitle = media_player.subtitles[selectedIndex];
        var subtitleSource = selectedSubtitle.source || 'api';
        
        console.log('Selecting subtitle:', selectedSubtitle.label, 'Source:', subtitleSource);
        
        if(subtitleSource === 'off') {
            // Turn off all subtitles
            this.disableAllSubtitles();
            if(successCallback) successCallback();
            return;
        }
        
        if(subtitleSource === 'native') {
            // Use native subtitle
            this.selectNativeSubtitle(selectedSubtitle, successCallback, errorCallback);
        } else if(subtitleSource === 'api') {
            // Use API subtitle
            this.selectApiSubtitle(selectedSubtitle, loadingCallback, successCallback, errorCallback);
        }
    },
    
    /**
     * Select native subtitle track
     * @param {Object} subtitle - Native subtitle object
     * @param {Function} successCallback - Success callback
     * @param {Function} errorCallback - Error callback
     */
    selectNativeSubtitle: function(subtitle, successCallback, errorCallback) {
        try {
            // Stop API subtitles first
            SrtOperation.stopOperation();
            
            // Enable native subtitle
            var nativeIndex = subtitle.originalIndex || subtitle.index;
            if(typeof nativeIndex !== 'undefined' && nativeIndex !== null && !isNaN(nativeIndex)) {
                media_player.setSubtitleOrAudioTrack("TEXT", nativeIndex);
                console.log('Native subtitle enabled:', nativeIndex);
                if(successCallback) successCallback();
            } else {
                if(errorCallback) errorCallback('Invalid native subtitle index');
            }
        } catch(e) {
            console.error('Error selecting native subtitle:', e);
            if(errorCallback) errorCallback(e);
        }
    },
    
    /**
     * Select API subtitle
     * @param {Object} subtitle - API subtitle object
     * @param {Function} loadingCallback - Loading callback
     * @param {Function} successCallback - Success callback  
     * @param {Function} errorCallback - Error callback
     */
    selectApiSubtitle: function(subtitle, loadingCallback, successCallback, errorCallback) {
        // Disable native subtitles first
        try {
            if(platform === 'samsung') {
                media_player.setSubtitleOrAudioTrack("TEXT", -1);
            } else if(platform === 'lg' && media_player.videoObj && media_player.videoObj.textTracks) {
                for(var i = 0; i < media_player.videoObj.textTracks.length; i++) {
                    media_player.videoObj.textTracks[i].mode = 'hidden';
                }
            }
        } catch(e) {
            console.error('Error disabling native subtitles:', e);
        }
        
        // Get subtitle file URL
        var subtitleFile = subtitle.apiData ? subtitle.apiData.file : subtitle.file;
        if(!subtitleFile) {
            if(errorCallback) errorCallback('No subtitle file available');
            return;
        }
        
        var subtitleUrl = subtitleFile;
        if(subtitleUrl.startsWith('/')) {
            subtitleUrl = 'https://exoapp.tv' + subtitleUrl;
        }
        
        console.log('Loading API subtitle:', subtitleUrl);
        
        if(loadingCallback) loadingCallback();
        
        // Load subtitle content
        $.ajax({
            url: subtitleUrl,
            method: 'GET',
            dataType: 'text',
            timeout: 15000,
            success: function(subtitleContent) {
                console.log('Subtitle content loaded successfully');
                
                // Get current video time
                var currentTime = 0;
                try {
                    if(platform === 'samsung' && typeof webapis !== 'undefined' && webapis.avplay) {
                        currentTime = webapis.avplay.getCurrentTime() / 1000; // Convert ms to seconds
                    } else if(media_player.videoObj && media_player.videoObj.currentTime) {
                        currentTime = media_player.videoObj.currentTime;
                    }
                } catch(e) {
                    currentTime = 0;
                }
                
                // Initialize SRT operation
                SrtOperation.init({content: subtitleContent}, currentTime);
                
                // Ensure subtitle container is visible
                $('#' + media_player.parent_id).find('.subtitle-container').show();
                
                if(successCallback) successCallback();
            },
            error: function(xhr, status, error) {
                console.error('Error loading subtitle:', error);
                if(errorCallback) errorCallback(error);
            }
        });
    },
    
    /**
     * Disable all subtitles (both API and native)
     */
    disableAllSubtitles: function() {
        // Stop API subtitles
        SrtOperation.stopOperation();
        
        // Disable native subtitles
        try {
            if(platform === 'samsung') {
                media_player.setSubtitleOrAudioTrack("TEXT", -1);
            } else if(platform === 'lg' && media_player.videoObj && media_player.videoObj.textTracks) {
                for(var i = 0; i < media_player.videoObj.textTracks.length; i++) {
                    media_player.videoObj.textTracks[i].mode = 'hidden';
                }
            }
        } catch(e) {
            console.error('Error disabling subtitles:', e);
        }
        
        console.log('All subtitles disabled');
    }
};