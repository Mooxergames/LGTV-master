"use strict";
var SrtOperation={
    current_srt_index:0,
    next_srt_time:0,
    srt:[],
    stopped:false,
    subtitle_shown:false,
    init: function (subtitle, current_time) {
        console.log("🎬 SUBTITLE DEBUG: === INITIALIZATION STARTED ===");
        console.log("🎬 SUBTITLE DEBUG: Current video time:", current_time);
        console.log("🎬 SUBTITLE DEBUG: Subtitle data:", subtitle ? "Available" : "Missing");
        
        // Same seconds logic as Samsung - simple and direct
        // Clear existing subtitles
        $('#' + media_player.parent_id).find('.subtitle-container').html('');
        this.subtitle_shown = false;
        
        // Parse SRT content
        var srt = [];
        if(subtitle && subtitle.content) {
            try {
                console.log("🎬 SUBTITLE DEBUG: Parsing SRT content...");
                SrtParser.init();
                srt = SrtParser.fromSrt(subtitle.content);
                console.log("🎬 SUBTITLE DEBUG: SRT parsed successfully, total subtitles:", srt.length);
                if(srt.length > 0) {
                    console.log("🎬 SUBTITLE DEBUG: First subtitle:", srt[0]);
                    console.log("🎬 SUBTITLE DEBUG: Last subtitle:", srt[srt.length - 1]);
                }
            } catch(e) {
                console.error('🎬 SUBTITLE DEBUG: SRT parsing error:', e);
            }
        }
        
        this.srt = srt;
        if(srt.length > 0) {
            this.stopped = false;
            // Find starting subtitle index using binary search - same as Samsung
            this.current_srt_index = this.findIndex(current_time, 0, srt.length - 1);
            if(this.current_srt_index < 0) this.current_srt_index = 0;
            
            console.log("🎬 SUBTITLE DEBUG: Binary search result:");
            console.log("🎬 SUBTITLE DEBUG: - Found index:", this.current_srt_index);
            console.log("🎬 SUBTITLE DEBUG: - Video time:", current_time);
            if(srt[this.current_srt_index]) {
                console.log("🎬 SUBTITLE DEBUG: - Current subtitle:", srt[this.current_srt_index]);
                console.log("🎬 SUBTITLE DEBUG: - Time range:", srt[this.current_srt_index].startSeconds, "to", srt[this.current_srt_index].endSeconds);
            }
        } else {
            this.stopped = true;
            console.log("🎬 SUBTITLE DEBUG: No subtitles available or parsing failed");
        }
        this.next_srt_time = 0;
        
        // Apply global subtitle settings immediately after initialization
        this.applyUserStyles();
        console.log("🎬 SUBTITLE DEBUG: === INITIALIZATION COMPLETED ===");
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
        // Same seconds logic as Samsung but with better progression handling + DEBUG
        if(this.stopped || !this.srt || this.srt.length === 0) {
            console.log("🕐 SUBTITLE SYNC: Stopped or no subtitles available");
            return;
        }
        
        // Track video time for real backward seek detection
        var previous_time = this.last_video_time || 0;
        var is_real_backward_seek = current_time < (previous_time - 1.0); // 1 second tolerance for normal playback jitter
        this.last_video_time = current_time;
        
        var srt_index = this.current_srt_index;
        if(srt_index >= this.srt.length || srt_index < 0) {
            console.log("🕐 SUBTITLE SYNC: Invalid index, searching...", {index: srt_index, length: this.srt.length});
            srt_index = this.findIndex(current_time, 0, this.srt.length - 1);
            this.current_srt_index = Math.max(0, srt_index);
            return;
        }
        
        var srt_item = this.srt[srt_index];
        
        // Simplified timing logging
        console.log("🕐 SUBTITLE SYNC:", {
            video_time: current_time,
            current_index: srt_index,
            subtitle_start: srt_item.startSeconds,
            subtitle_end: srt_item.endSeconds,
            subtitle_text: srt_item.text.substring(0, 30) + "...",
            currently_shown: this.subtitle_shown
        });
        
        // **SHOW SUBTITLE**: Current time within subtitle range - same timing as Samsung
        if(current_time >= srt_item.startSeconds && current_time < srt_item.endSeconds) {
            console.log("🕐 SUBTITLE SYNC: ✅ Time within range - should show subtitle");
            if(!this.subtitle_shown) {
                console.log("🕐 SUBTITLE SYNC: 🎯 Showing subtitle:", srt_item.text);
                this.showSubtitle(srt_item.text);
                this.subtitle_shown = true;
            }
        }
        // **HIDE SUBTITLE**: Time passed subtitle end - handle progression
        else if(current_time >= srt_item.endSeconds) {
            console.log("🕐 SUBTITLE SYNC: ⏭️ Time past subtitle end, checking next...");
            var next_srt_item = this.srt[srt_index + 1];
            
            if(next_srt_item && current_time < next_srt_item.startSeconds) {
                // Gap between subtitles - hide current and advance index
                console.log("🕐 SUBTITLE SYNC: 📝 In gap between subtitles - hiding and advancing index");
                if(this.subtitle_shown) {
                    this.hideSubtitle();
                    this.subtitle_shown = false;
                }
                // FIX: Advance to next subtitle index to avoid getting stuck
                this.current_srt_index = srt_index + 1;
                console.log("🕐 SUBTITLE SYNC: 🔧 Advanced index to:", this.current_srt_index);
            } else if(next_srt_item && current_time >= next_srt_item.startSeconds && current_time < next_srt_item.endSeconds) {
                // Show next subtitle
                console.log("🕐 SUBTITLE SYNC: ⏭️ Moving to next subtitle:", next_srt_item.text);
                this.showSubtitle(next_srt_item.text);
                this.current_srt_index += 1;
                this.subtitle_shown = true;
            } else {
                // **SEEK DETECTION**: Use binary search to find correct index
                console.log("🕐 SUBTITLE SYNC: 🔍 SEEK DETECTED - searching for correct position");
                if(this.subtitle_shown) {
                    this.hideSubtitle();
                    this.subtitle_shown = false;
                }
                var new_index = this.findIndex(current_time, 0, this.srt.length - 1);
                console.log("🕐 SUBTITLE SYNC: 🔍 Search result: index", new_index);
                this.current_srt_index = new_index;
            }
        }
        // **BACKWARDS SEEK**: Only detect REAL backward seeks, not gaps between subtitles  
        else if(current_time < srt_item.startSeconds && is_real_backward_seek) {
            console.log("🕐 SUBTITLE SYNC: ⏪ REAL BACKWARD SEEK DETECTED", {
                current_time: current_time,
                previous_time: previous_time,
                time_diff: current_time - previous_time,
                subtitle_start: srt_item.startSeconds
            });
            if(this.subtitle_shown) {
                this.hideSubtitle();
                this.subtitle_shown = false;
            }
            var new_index = this.findIndex(current_time, 0, this.srt.length - 1);
            console.log("🕐 SUBTITLE SYNC: ⏪ Backward search result: index", new_index);
            this.current_srt_index = new_index;
        }
        // **GAP HANDLING**: Video time before subtitle start but no real backward seek
        else if(current_time < srt_item.startSeconds) {
            console.log("🕐 SUBTITLE SYNC: 📝 Normal gap - waiting for subtitle start", {
                current_time: current_time,
                subtitle_start: srt_item.startSeconds,
                wait_time: (srt_item.startSeconds - current_time).toFixed(3) + "s"
            });
            if(this.subtitle_shown) {
                this.hideSubtitle();
                this.subtitle_shown = false;
            }
        }
    },
    showSubtitle: function(text) {
        console.log("🎯 SUBTITLE SHOW: Displaying subtitle:", text);
        // Enhanced subtitle display with better formatting
        var subtitleHtml = '<div class="subtitle-text">' + text.replace(/\n/g, '<br>') + '</div>';
        var subtitleContainer = $('#' + media_player.parent_id).find('.subtitle-container');
        subtitleContainer.html(subtitleHtml);
        subtitleContainer.show(); // Ensure container is visible when showing subtitles
        
        // Apply user settings AFTER inserting the HTML so styles apply to new elements
        this.applyUserStyles();
        console.log("🎯 SUBTITLE SHOW: Subtitle displayed and styled");
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
            case 'none':
                return {
                    background: 'transparent',
                    color: '#fff',
                    textShadow: 'none', // No shadows/outlines for transparent background
                    padding: '0px',     // No padding to avoid visible borders
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
        console.log("🚫 SUBTITLE HIDE: Hiding subtitle");
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
