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
        // 🔧 TIMING DEBUG: Add comprehensive subtitle timing logs
        console.log("⏰ SUBTITLE TIMING DEBUG:", {
            current_time: current_time,
            current_time_formatted: this.formatTimeForDebug(current_time),
            stopped: this.stopped,
            srt_length: this.srt ? this.srt.length : 0,
            current_srt_index: this.current_srt_index,
            subtitle_shown: this.subtitle_shown
        });

        // Exact timing logic from exoapp - no compensation offsets
        if(this.stopped || !this.srt || this.srt.length === 0) {
            console.log("🚫 SUBTITLE TIMING: Stopped or no subtitles available");
            return;
        }
        
        var srtIndex = this.current_srt_index;
        if(srtIndex >= this.srt.length || srtIndex < 0) {
            console.log("🔍 SUBTITLE TIMING: Finding new index for time", current_time);
            srtIndex = this.findIndex(current_time, 0, this.srt.length - 1);
            this.current_srt_index = Math.max(0, srtIndex);
            console.log("📍 SUBTITLE TIMING: New index found:", this.current_srt_index);
            return;
        }
        
        var srtItem = this.srt[srtIndex];
        console.log("📝 SUBTITLE TIMING: Current item check:", {
            index: srtIndex,
            startSeconds: srtItem.startSeconds,
            endSeconds: srtItem.endSeconds,
            text_preview: srtItem.text ? srtItem.text.substring(0, 50) + "..." : "No text",
            should_show: current_time >= srtItem.startSeconds && current_time < srtItem.endSeconds
        });
        
        // Check if current subtitle should be displayed - exact timing
        if(current_time >= srtItem.startSeconds && current_time < srtItem.endSeconds) {
            if(!this.subtitle_shown) {
                console.log("✅ SUBTITLE TIMING: Showing subtitle at", current_time, ":", srtItem.text.substring(0, 100));
                this.showSubtitle(srtItem.text);
                this.subtitle_shown = true;
            }
        } else {
            // Hide subtitle when out of time range
            if(this.subtitle_shown) {
                console.log("❌ SUBTITLE TIMING: Hiding subtitle at", current_time);
                this.hideSubtitle();
                this.subtitle_shown = false;
            }
            
            // Find next subtitle
            var newIndex = this.findIndex(current_time, 0, this.srt.length - 1);
            if(newIndex >= 0 && newIndex !== this.current_srt_index) {
                console.log("🔄 SUBTITLE TIMING: Moving to index", newIndex, "from", this.current_srt_index);
                this.current_srt_index = newIndex;
            }
        }
    },
    
    formatTimeForDebug: function(seconds) {
        var min = Math.floor(seconds / 60);
        var sec = Math.floor(seconds % 60);
        var ms = Math.floor((seconds % 1) * 1000);
        return min + ":" + (sec < 10 ? "0" : "") + sec + "." + (ms < 100 ? "0" : "") + (ms < 10 ? "0" : "") + ms;
    },
    showSubtitle: function(text) {
        // Enhanced subtitle display with better formatting
        var subtitleHtml = '<div class="subtitle-text">' + text.replace(/\n/g, '<br>') + '</div>';
        var subtitleContainer = $('#' + media_player.parent_id).find('.subtitle-container');
        subtitleContainer.html(subtitleHtml);
        subtitleContainer.show(); // Ensure container is visible when showing subtitles
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
