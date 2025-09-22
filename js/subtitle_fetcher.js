"use strict";

/**
 * Enhanced Subtitle Fetcher - API Integration from ExoApp
 * Fetches subtitles from exoapp.tv API with enhanced episode matching
 */
var SubtitleFetcher = {
    apiUrl: 'https://exoapp.tv/api/get-subtitles',
    
    /**
     * Fetch subtitles for movies or series episodes
     * @param {Object} movieData - Movie or episode data
     * @param {string} movieType - 'movie' or 'episode'
     * @param {Function} successCallback - Called on success
     * @param {Function} errorCallback - Called on error
     */
    fetchSubtitles: function(movieData, movieType, successCallback, errorCallback) {
        var movieName = movieData.name;
        
        // Clean movie name for better API matching
        if (movieType === 'movie' && movieName) {
            // Remove year from title (e.g., "Thor: Love and Thunder (2022)" -> "Thor: Love and Thunder")
            movieName = movieName.replace(/\s*\(\d{4}\)\s*$/g, '').trim();
        }
        
        var subtitleRequestData = {
            movie_name: movieName,
            movie_type: movieType || 'movie'
        };
        
        // Enhanced episode name parsing for better subtitle matching
        if (movieType === 'episode' && movieData.name) {
            var episodeName = movieData.name.toLowerCase();
            
            // Parse episode patterns like "The Witcher S01 E01"
            var seasonEpisodeMatch = episodeName.match(/s(\d+)\s*e(\d+)/i);
            if (seasonEpisodeMatch) {
                subtitleRequestData.season_number = parseInt(seasonEpisodeMatch[1]);
                subtitleRequestData.episode_number = parseInt(seasonEpisodeMatch[2]);
                
                // Extract clean series name
                var seriesName = episodeName.replace(/s\d+\s*e\d+.*$/i, '').trim();
                subtitleRequestData.movie_name = seriesName;
            }
        }
        
        // Prioritize TMDB ID if available
        if (movieData.tmdb_id) {
            subtitleRequestData.tmdb_id = movieData.tmdb_id;
        }
        
        // Make API request
        $.ajax({
            method: 'post',
            url: this.apiUrl,
            data: subtitleRequestData,
            dataType: 'json',
            timeout: 10000, // 10 second timeout
            success: function(result) {
                if(result.status === 'success' && result.subtitles && result.subtitles.length > 0) {
                    // Mark subtitles as API source
                    result.subtitles.forEach(function(subtitle) {
                        subtitle.source = 'api';
                        subtitle.apiData = subtitle;
                    });
                    
                    if(successCallback) {
                        successCallback(result.subtitles);
                    }
                } else {
                    console.log('No API subtitles found, using fallback');
                    if(errorCallback) {
                        errorCallback('No subtitles found');
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Subtitle API error:', error);
                if(errorCallback) {
                    errorCallback(error);
                }
            }
        });
    },
    
    /**
     * Get native subtitle tracks from the current media player
     * @returns {Array} Array of native subtitle tracks
     */
    getNativeSubtitles: function() {
        var nativeSubtitles = [];
        
        try {
            if(typeof media_player !== 'undefined' && media_player.getSubtitleOrAudioTrack) {
                var tracks = media_player.getSubtitleOrAudioTrack("TEXT");
                if(tracks && tracks.length > 0) {
                    tracks.forEach(function(track, index) {
                        var label, language, trackIndex;
                        
                        // Handle Samsung vs LG track structure differences based on data shape
                        if(track.extra_info) {
                            // Samsung structure: track.extra_info contains track_lang and index
                            var extraInfo = typeof track.extra_info === 'string' ? 
                                JSON.parse(track.extra_info) : track.extra_info;
                            language = extraInfo.track_lang || 'unknown';
                            label = 'Track ' + (index + 1) + ' (' + language + ')';
                            // Use Samsung's canonical index for proper track selection
                            trackIndex = extraInfo.index !== undefined ? extraInfo.index : index;
                        } else {
                            // LG structure: track.label, track.language
                            label = track.label || 'Native Track ' + (index + 1);
                            language = track.language || 'unknown';
                            trackIndex = track.index !== undefined ? track.index : index;
                        }
                        
                        nativeSubtitles.push({
                            source: 'native',
                            index: trackIndex,
                            originalIndex: trackIndex,
                            label: label,
                            language: language
                        });
                    });
                }
            }
        } catch(e) {
            console.error('Error getting native subtitles:', e);
        }
        
        return nativeSubtitles;
    },
    
    /**
     * Combine API and native subtitles into a single list
     * @param {Array} apiSubtitles - Subtitles from API
     * @param {Array} nativeSubtitles - Native subtitle tracks
     * @returns {Array} Combined subtitle list
     */
    combineSubtitles: function(apiSubtitles, nativeSubtitles) {
        var combined = [];
        
        // Add "Turn Off Subtitles" option first
        combined.push({
            source: 'off',
            label: 'Turn Off Subtitles',
            language: 'none'
        });
        
        // Add API subtitles
        if(apiSubtitles && apiSubtitles.length > 0) {
            combined = combined.concat(apiSubtitles);
        }
        
        // Add native subtitles
        if(nativeSubtitles && nativeSubtitles.length > 0) {
            combined = combined.concat(nativeSubtitles);
        }
        
        return combined;
    }
};