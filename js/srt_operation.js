"use strict";
var SrtOperation={
    current_srt_index:0,
    next_srt_time:0,
    srt:[],
    stopped:false,
    subtitle_shown:false,
    init: function (subtitle, current_time) {
        // Enhanced initialization from exo app
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
            // Find starting subtitle index using binary search - exact timing
            this.current_srt_index = this.findIndex(current_time, 0, srt.length - 1);
            if(this.current_srt_index < 0) this.current_srt_index = 0;
            console.log("SRT initialized - found index:", this.current_srt_index, "for time:", current_time);
        } else {
            this.stopped = true;
            console.log("No subtitles available or parsing failed");
        }
        this.next_srt_time = 0;
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
        // Exact timing logic from exoapp - no compensation offsets
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
        
        // Check if current subtitle should be displayed - exact timing
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
        // Apply user settings before showing subtitle
        this.applyUserStyles();
        
        // Enhanced subtitle display with better formatting
        var subtitleHtml = '<div class="subtitle-text">' + text.replace(/\n/g, '<br>') + '</div>';
        var subtitleContainer = $('#' + media_player.parent_id).find('.subtitle-container');
        subtitleContainer.html(subtitleHtml);
        subtitleContainer.show(); // Ensure container is visible when showing subtitles
    },
    
    applyUserStyles: function() {
        // Apply user subtitle settings via CSS custom properties
        if(typeof settings !== 'undefined') {
            var size = this.getSizeValue(settings.subtitle_size || 'medium');
            var bgColor = this.getBackgroundValue(settings.subtitle_bg_color || 'black');
            var textColor = this.getTextColorValue(settings.subtitle_text_color || 'white');
            var outline = this.getOutlineValue(settings.subtitle_text_color || 'white');
            
            document.documentElement.style.setProperty('--subtitle-size', size);
            document.documentElement.style.setProperty('--subtitle-bg', bgColor);
            document.documentElement.style.setProperty('--subtitle-color', textColor);
            document.documentElement.style.setProperty('--subtitle-outline', outline);
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
