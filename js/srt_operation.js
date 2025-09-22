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
            // Find starting subtitle index using binary search with start lead compensation
            var start_lead = 0.12; // 120ms lead for better timing synchronization
            var compensated_time = current_time + start_lead;
            this.current_srt_index = this.findIndex(compensated_time, 0, srt.length - 1);
            if(this.current_srt_index < 0) this.current_srt_index = 0;
            console.log("SRT initialized - found index:", this.current_srt_index, "for time:", current_time, "with lead:", start_lead);
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
        // Enhanced timing logic from exo app
        if(this.stopped || !this.srt || this.srt.length === 0) {
            return;
        }
        
        // Add asymmetric timing compensation for better synchronization
        var start_lead = 0.12; // 120ms lead for subtitle start to compensate for delay
        var end_lag = 0.05; // 50ms lag for subtitle end to prevent abrupt cutoff
        
        var srtIndex = this.current_srt_index;
        if(srtIndex >= this.srt.length || srtIndex < 0) {
            srtIndex = this.findIndex(current_time + start_lead, 0, this.srt.length - 1);
            this.current_srt_index = Math.max(0, srtIndex);
            // Continue processing instead of returning to avoid one-tick delay
            if(this.current_srt_index < this.srt.length) {
                srtIndex = this.current_srt_index;
            } else {
                return;
            }
        }
        
        var srtItem = this.srt[srtIndex];
        
        // Check if current subtitle should be displayed (asymmetric timing)
        if((current_time + start_lead) >= srtItem.startSeconds && current_time <= (srtItem.endSeconds + end_lag)) {
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
            
            // Find next subtitle using binary search for efficiency
            var newIndex = this.findIndex(current_time + start_lead, 0, this.srt.length - 1);
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
