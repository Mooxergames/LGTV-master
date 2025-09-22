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
        var subtitleRequestData = {};
        
        // MOVIES: Enhanced processing following exoapp methodology
        if (movieType === 'movie') {
            var originalName = movieData.name || '';
            var cleanedName = originalName;
            
            // Step 1: Extract year from name
            var yearMatch = cleanedName.match(/\((\d{4})\)/);
            var extractedYear = null;
            if (yearMatch) {
                extractedYear = parseInt(yearMatch[1]);
                // Remove year from name: "Movie Name (2023)" → "Movie Name"
                cleanedName = cleanedName.replace(/\s*\(\d{4}\)\s*/, '').trim();
            }
            
            // Step 2: Remove quality indicators that interfere with matching
            var qualityPatterns = /\s*\b(HD|4K|1080p|720p|480p|BluRay|BRRip|WEB-DL|WEBRip|DVDRip|CAMRip|TS|TC|HDTV|PDTV|XviD|x264|x265|HEVC|DivX|AC3|AAC|MP3|Dubbed|Subbed|MultiAudio)\b\s*/gi;
            cleanedName = cleanedName.replace(qualityPatterns, ' ').trim();
            cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
            
            // Step 3: Remove bracketed content (except years)
            cleanedName = cleanedName.replace(/\[.*?\]/g, '').trim();
            cleanedName = cleanedName.replace(/\{.*?\}/g, '').trim();
            cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
            
            // Step 4: Build request data
            subtitleRequestData = {
                movie_name: cleanedName,
                movie_type: 'movie'
            };
            
            // Step 5: Add TMDB ID (highest priority for matching)
            if (movieData.tmdb_id) {
                subtitleRequestData.tmdb_id = movieData.tmdb_id;
            }
            
            // Step 6: Add year for better matching
            if (extractedYear) {
                subtitleRequestData.year = extractedYear;
            } else if (movieData.year) {
                subtitleRequestData.year = movieData.year;
            }
            
            console.log('Movie subtitle request - Original:', originalName, 'Cleaned:', cleanedName, 'Year:', subtitleRequestData.year, 'TMDB:', subtitleRequestData.tmdb_id);
        } 
        // EPISODES: Enhanced logic with episode name parsing fallback
        else {
            var episodeName = movieData.title || movieData.name || movieData.episode_name || '';
            
            
            subtitleRequestData = {
                movie_type: 'episode'
            };
            
            // ROBUST STAGED STRATEGY: Name-first approach (IPTV providers often have wrong TMDB IDs)
            console.log('🎯 Processing episode with staged name-first approach');
            var parsedEpisode = this.parseEpisodeName(episodeName);
            
            if (parsedEpisode.series_name) {
                // Format as single string: "dos tumbas s01 e01" 
                var formattedName = parsedEpisode.series_name.toLowerCase();
                
                if (parsedEpisode.season_number && parsedEpisode.episode_number) {
                    var seasonStr = 's' + String(parsedEpisode.season_number).padStart(2, '0');
                    var episodeStr = 'e' + String(parsedEpisode.episode_number).padStart(2, '0');
                    formattedName = formattedName + ' ' + seasonStr + ' ' + episodeStr;
                }
                
                subtitleRequestData.movie_name = formattedName;
                console.log('✅ Using name-based matching (primary):', formattedName);
                
                // Store potential TMDB IDs for fallback attempts (DO NOT include in first request)
                subtitleRequestData._episode_tmdb_fallback = movieData.info ? movieData.info.tmdb_id : null;
                subtitleRequestData._series_tmdb_fallback = movieData.series_tmdb_id || null;
                
            } else {
                // No pattern recognized - try auto-detection with original name
                subtitleRequestData.movie_name = episodeName;
                subtitleRequestData.movie_type = 'auto';
                console.log('No episode pattern - using auto-detection with original name:', episodeName);
            }
            
            console.log('Episode subtitle request data:', {
                movie_type: subtitleRequestData.movie_type,
                tmdb_id: subtitleRequestData.tmdb_id,
                movie_name: subtitleRequestData.movie_name,
                original_episode: episodeName
            });
        }
        
        // STAGED API REQUESTS: Name-first, then TMDB ID fallbacks
        var that = this;
        
        // Clean up internal fallback fields before sending request
        var episodeTmdbFallback = subtitleRequestData._episode_tmdb_fallback;
        var seriesTmdbFallback = subtitleRequestData._series_tmdb_fallback;
        delete subtitleRequestData._episode_tmdb_fallback;
        delete subtitleRequestData._series_tmdb_fallback;
        
        // STAGE 1: Name-based request (most reliable for IPTV providers)
        console.log('🎯 Stage 1: Name-based subtitle request');
        this.makeSubtitleRequest(subtitleRequestData, function(subtitles) {
            // SUCCESS: Name-based matching worked
            if(successCallback) {
                successCallback(subtitles);
            }
        }, function(error) {
            // STAGE 2: Try with episode TMDB ID if available
            if(episodeTmdbFallback) {
                console.log('🎯 Stage 2: Retry with episode TMDB ID:', episodeTmdbFallback);
                var episodeRequestData = Object.assign({}, subtitleRequestData, {
                    tmdb_id: String(episodeTmdbFallback)
                });
                
                that.makeSubtitleRequest(episodeRequestData, function(subtitles) {
                    if(successCallback) {
                        successCallback(subtitles);
                    }
                }, function(error2) {
                    // STAGE 3: Try with series TMDB ID if available
                    if(seriesTmdbFallback) {
                        console.log('🎯 Stage 3: Retry with series TMDB ID:', seriesTmdbFallback);
                        var seriesRequestData = Object.assign({}, subtitleRequestData, {
                            tmdb_id: String(seriesTmdbFallback)
                        });
                        
                        that.makeSubtitleRequest(seriesRequestData, successCallback, errorCallback);
                    } else {
                        if(errorCallback) {
                            errorCallback('No subtitles found in all stages');
                        }
                    }
                });
            } else if(seriesTmdbFallback) {
                // Skip to stage 3 if no episode TMDB
                console.log('🎯 Stage 2 (direct): Retry with series TMDB ID:', seriesTmdbFallback);
                var seriesRequestData = Object.assign({}, subtitleRequestData, {
                    tmdb_id: String(seriesTmdbFallback)
                });
                
                that.makeSubtitleRequest(seriesRequestData, successCallback, errorCallback);
            } else {
                if(errorCallback) {
                    errorCallback('No subtitles found');
                }
            }
        });
    },
    
    /**
     * Make individual subtitle API request
     * @param {Object} requestData - Subtitle request data
     * @param {Function} successCallback - Success callback
     * @param {Function} errorCallback - Error callback
     */
    makeSubtitleRequest: function(requestData, successCallback, errorCallback) {
        $.ajax({
            method: 'post',
            url: this.apiUrl,
            data: requestData,
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
                    if(errorCallback) {
                        errorCallback('No subtitles found');
                    }
                }
            },
            error: function(xhr, status, error) {
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
        
        // Add "Off" option first
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
    },
    
    /**
     * Enhanced Episode Name Parser following exoapp methodology
     * @param {string} episodeName - Episode name to parse
     * @returns {Object} Parsed episode data
     */
    parseEpisodeName: function(episodeName) {
        var result = {
            series_name: null,
            season_number: null,
            episode_number: null,
            episode_title: null
        };
        
        if (!episodeName || typeof episodeName !== 'string') {
            return result;
        }
        
        var cleanedName = episodeName.trim();
        
        // Step 1: Remove country/language codes (TR:, ES:, EN:, etc.)
        cleanedName = cleanedName.replace(/^[A-Z]{2}:\s*/i, '');
        
        // Step 2: Try multiple season/episode patterns
        var seasonEpisodePatterns = [
            // "Series Name S01 E01" or "Series Name S01E01"
            /^(.+?)\s+S(\d{1,2})\s*E(\d{1,2})(?:\s*-\s*(.+))?$/i,
            // "Series Name Season 1 Episode 1"
            /^(.+?)\s+Season\s+(\d{1,2})\s+Episode\s+(\d{1,2})(?:\s*-\s*(.+))?$/i,
            // "Series Name 1x01" or "Series Name 1x1"
            /^(.+?)\s+(\d{1,2})x(\d{1,2})(?:\s*-\s*(.+))?$/i,
            // "Series Name (2023) S01E01"
            /^(.+?)\s*\(\d{4}\)\s*S(\d{1,2})E(\d{1,2})(?:\s*-\s*(.+))?$/i
        ];
        
        // Try each pattern
        for (var i = 0; i < seasonEpisodePatterns.length; i++) {
            var match = cleanedName.match(seasonEpisodePatterns[i]);
            if (match) {
                result.series_name = match[1].trim();
                result.season_number = parseInt(match[2]);
                result.episode_number = parseInt(match[3]);
                if (match[4]) {
                    result.episode_title = match[4].trim();
                }
                break;
            }
        }
        
        // Step 3: If no pattern found, extract just series name
        if (!result.series_name) {
            var seriesOnly = cleanedName
                .replace(/\s*\(.*?\)/g, '') // Remove parentheses content
                .replace(/\s*\[.*?\]/g, '') // Remove brackets content  
                .replace(/\s*\{.*?\}/g, '') // Remove curly braces content
                .replace(/\s*-\s*Episode.*$/i, '') // Remove "- Episode X" suffix
                .replace(/\s*Ep\s*\d+.*$/i, '') // Remove "Ep 1" suffix
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();
                
            if (seriesOnly && seriesOnly.length > 2) {
                result.series_name = seriesOnly;
            }
        }
        
        // Step 4: Clean and normalize the series name
        if (result.series_name) {
            result.series_name = result.series_name
                .replace(/\s*\(.*?\)/g, '') // Remove remaining parentheses
                .replace(/\s*\[.*?\]/g, '') // Remove remaining brackets
                .replace(/\s*\{.*?\}/g, '') // Remove remaining braces
                .replace(/[^\w\s&'-]/g, ' ') // Keep only safe characters
                .replace(/\s+/g, ' ') // Normalize multiple spaces
                .trim();
        }
        
        return result;
    }
};