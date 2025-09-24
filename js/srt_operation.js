"use strict";
var SrtOperation={
    current_srt_index:0,
    next_srt_time:0,
    srt:[],
    stopped:false,
    subtitle_shown:false,
    init: function (subtitle, current_time) {
        // Same seconds logic as Samsung - simple and direct
        // Clear existing subtitles
        $('#' + media_player.parent_id).find('.subtitle-container').html('');
        this.subtitle_shown = false;
        
        // Parse SRT content
        var srt = [];
        if(subtitle && subtitle.content) {
            try {
                SrtParser.init();
                srt = SrtParser.fromSrt(subtitle.content);
            } catch(e) {
                console.error('SRT parsing error:', e);
            }
        }
        
        this.srt = srt;
        if(srt.length > 0) {
            this.stopped = false;
            // Find starting subtitle index using binary search - same as Samsung
            this.current_srt_index = this.findIndex(current_time, 0, srt.length - 1);
            if(this.current_srt_index < 0) this.current_srt_index = 0;
            console.log("SRT initialized - found index:", this.current_srt_index, "for time:", current_time);
        } else {
            this.stopped = true;
            console.log("No subtitles available or parsing failed");
        }
        this.next_srt_time = 0;
        
        // Apply global subtitle settings immediately after initialization
        this.applyUserStyles();
    },
    findIndex: function (time,start, end) {  // we will use binary search algorithm here
        if(time==0)
            return 0;

        // Base Condition
        var arr=this.srt;
        if (start > end)
            return end;
        // Find the middle index
        let mid=Math.floor((start + end)/2);

        // Compare mid with given key x
        if (arr[mid].startSeconds<=time && time<arr[mid].endSeconds)
            return mid;


        // If element at mid is greater than x,
        // search in the left half of mid
        if(arr[mid].startSeconds > time)
            return this.findIndex(time, start, mid-1);
        else
            // If element at mid is smaller than x,
            // search in the right half of mid
            return this.findIndex(time, mid+1, end);
    },
    timeChange: function(current_time) {
        // Same logic as Samsung - simple and direct
        if(this.stopped || !this.srt || this.srt.length === 0) {
            return;
        }
        
        var srtIndex = this.current_srt_index;
        if(srtIndex >= this.srt.length || srtIndex < 0) {
            srtIndex = this.findIndex(current_time, 0, this.srt.length - 1);
            this.current_srt_index = Math.max(0, srtIndex);
            return;
        }
        
        var srtItem = this.srt[srtIndex];
        
        // Check if current subtitle should be displayed - same exact timing as Samsung
        if(current_time >= srtItem.startSeconds && current_time < srtItem.endSeconds) {
            if(!this.subtitle_shown) {
                this.showSubtitle(srtItem.text);
                this.subtitle_shown = true;
            }
        } else {
            // Hide subtitle when out of time range
            if(this.subtitle_shown) {
                this.hideSubtitle();
                this.subtitle_shown = false;
            }
            
            // Find next subtitle
            var newIndex = this.findIndex(current_time, 0, this.srt.length - 1);
            if(newIndex >= 0 && newIndex !== this.current_srt_index) {
                this.current_srt_index = newIndex;
            }
        }
    },
    showSubtitle: function(text) {
        // Enhanced subtitle display with better formatting
        var subtitleHtml = '<div class="subtitle-text">' + text.replace(/\n/g, '<br>') + '</div>';
        var subtitleContainer = $('#' + media_player.parent_id).find('.subtitle-container');
        subtitleContainer.html(subtitleHtml);
        subtitleContainer.show(); // Ensure container is visible when showing subtitles
        
        // Apply user settings AFTER inserting the HTML so styles apply to new elements
        this.applyUserStyles();
    },
    
    applyUserStyles: function() {
        // Apply user subtitle settings from localStorage (saved by subtitle settings modal)
        var position = parseInt(localStorage.getItem('subtitle_position') || '10');
        var size = parseInt(localStorage.getItem('subtitle_size') || '18');
        var bgType = localStorage.getItem('subtitle_background') || 'black';
        
        // Get background style based on saved setting
        var backgroundStyle = this.getBackgroundStyleFromType(bgType);
        
        // Apply styles directly to subtitle container
        var subtitleContainer = $('#' + media_player.parent_id).find('.subtitle-container');
        subtitleContainer.css({
            'bottom': position + 'vh',
            'top': 'auto',
            'font-size': size + 'px',
            'background': backgroundStyle.background,
            'color': backgroundStyle.color,
            'text-shadow': backgroundStyle.textShadow,
            'padding': backgroundStyle.padding,
            'border-radius': backgroundStyle.borderRadius
        });
        
        // Also apply to subtitle text elements
        subtitleContainer.find('.subtitle-text').css({
            'font-size': size + 'px',
            'background': backgroundStyle.background,
            'color': backgroundStyle.color,
            'text-shadow': backgroundStyle.textShadow,
            'padding': backgroundStyle.padding,
            'border-radius': backgroundStyle.borderRadius
        });
    },
    
    getBackgroundStyleFromType: function(bgType) {
        switch(bgType) {
            case 'transparent':
                return {
                    background: 'transparent',
                    color: '#fff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    padding: '2px 6px',
                    borderRadius: '0px'
                };
            case 'black':
                return {
                    background: 'rgba(0,0,0,0.8)',
                    color: '#fff',
                    textShadow: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px'
                };
            case 'gray':
                return {
                    background: 'rgba(128,128,128,0.8)',
                    color: '#fff',
                    textShadow: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px'
                };
            case 'dark':
                return {
                    background: 'rgba(22,25,30,0.9)',
                    color: '#fff',
                    textShadow: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px'
                };
            default:
                return this.getBackgroundStyleFromType('black');
        }
    },

    getSizeValue: function(size) {
        var sizes = {
            'small': '18px',
            'medium': '24px', 
            'large': '32px',
            'extra-large': '40px'
        };
        return sizes[size] || '24px';
    },
    
    getBackgroundValue: function(color) {
        var backgrounds = {
            'transparent': 'transparent',
            'black': 'rgba(0, 0, 0, 0.8)',
            'red': 'rgba(255, 0, 0, 0.8)',
            'white': 'rgba(255, 255, 255, 0.8)',
            'blue': 'rgba(0, 0, 255, 0.8)'
        };
        return backgrounds[color] || 'rgba(0, 0, 0, 0.8)';
    },
    
    getTextColorValue: function(color) {
        var colors = {
            'white': '#ffffff',
            'black': '#000000',
            'yellow': '#ffff00',
            'red': '#ff0000',
            'green': '#00ff00'
        };
        return colors[color] || '#ffffff';
    },
    
    getOutlineValue: function(textColor) {
        // Provide contrast outline based on text color
        if(textColor === 'white' || textColor === 'yellow') {
            return '1px 1px 2px rgba(0, 0, 0, 0.8)';
        } else {
            return '1px 1px 2px rgba(255, 255, 255, 0.8)';
        }
    },
    
    hideSubtitle: function() {
        var subtitleContainer = $('#' + media_player.parent_id).find('.subtitle-container');
        subtitleContainer.html('');
        // Keep container visible but empty - don't hide it as it may be needed again
    },
    
    stopOperation: function () {
        this.stopped = true;
        this.hideSubtitle();
        this.subtitle_shown = false;
    },
    
    deStruct: function () {
        this.srt = [];
        this.stopped = true;
        this.hideSubtitle();
        this.current_srt_index = 0;
        this.subtitle_shown = false;
    }
}
