# Overview

FLIX IPTV is a cross-platform TV application designed for LG WebOS and Samsung Tizen smart TVs. The application provides IPTV streaming capabilities with support for live channels, video-on-demand (VOD), series, catch-up TV, and YouTube integration. It features a comprehensive user interface with channel guides, search functionality, local storage file browsing, and image galleries.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

- **Improved subtitle "bottom" position placement** - Adjusted the subtitle position "bottom" preset from 5vh to 2vh, moving subtitles closer to the actual bottom of the screen for better readability and positioning. This change maintains all down button navigation functionality while providing improved subtitle placement at the lowest screen position.
- **Completely redesigned and optimized subtitle modal system** - Implemented comprehensive performance improvements including removal of expensive CSS effects (backdrop-filter, heavy gradients), TV-optimized design with larger fonts (22-26px) and better contrast, subtitle caching system for instant reopening, event delegation with 60fps throttling, and requestAnimationFrame-based DOM updates. Modal now opens in <50ms and provides smooth navigation on Samsung Tizen and LG WebOS platforms.
- **Fixed subtitle display issues** - Resolved empty subtitle background line appearing when no subtitles are active by properly hiding the subtitle container, and updated subtitle background color options changing 'Gray' to 'Red' and 'Dark' to 'Green' in the settings modal for better user preference options.
- **Cleaned up all debugging logs** - Removed all debugging console.log statements from the entire application while keeping essential error handling. Removed debug logs from subtitle system, video player, and all other components for cleaner code and better performance.
- **Completely removed Recently Viewed functionality** - Removed recently viewed tracking for both movies and series, including category creation, data storage, and all related functionality to simplify the user interface
- Completely removed random VOD favorites auto-seeding functionality with full cleanup and cache-busting implementation
- Fixed favorites removal empty space issue with automatic grid refresh for both direct removal and detail page removal scenarios
- Added poster as backdrop fallback functionality for movies and series when backdrop images are missing
- Fixed debug back button navigation to properly return to VOD page using vod_summary_page.goBack() function
- **Added Resume Watching functionality for series episodes** - Series now include a "Resume Watching" category that shows series with episodes that have saved viewing progress, bringing feature parity with movie functionality
- **Implemented subtitle positioning controls for movie player** - Added comprehensive subtitle position adjustment system with dedicated modal interface, Up/Down position controls, preset positions (bottom, middle, center, upper), live preview, and keyboard navigation integration. Users can now customize subtitle vertical placement and save their preferences to local storage.
- **Fixed Samsung TV resolution display bug** - Resolved issue where live TV resolution would show "undefined*undefined" after initial correct display by adding proper validation for Samsung webapis.avplay.getCurrentStreamInfo() Width/Height values. Resolution now falls back gracefully to channel name-based display when Samsung API values are invalid.
- **Enhanced aspect ratio controls for VOD player** - Implemented comprehensive aspect ratio cycling system for both Samsung Tizen and LG WebOS platforms. Samsung now cycles through Auto/Fit Screen/Fill Screen modes using native webapis.avplay.setDisplayMethod(), while LG uses CSS object-fit properties (contain/cover/fill) for equivalent functionality. Both platforms provide silent aspect ratio switching without user notifications.
- **Fixed live TV resolution display overflow** - Resolved video resolution text overflowing outside the player bar on various TV models by removing problematic viewport-fixed positioning and implementing proper containment within the status indicators container. Added overflow protection with text truncation and maximum width constraints to ensure resolution display stays within player bar bounds across all Samsung Tizen and LG WebOS devices.
- **Repositioned resolution display under LIVE indicator** - Fixed resolution positioning to appear directly under the LIVE indicator with identical right-side padding (1.8vw). Created new vertical stack layout using flex column with 8px gap, ensuring both elements share exact alignment and visual consistency while maintaining proper overflow protection on all TV models.

# System Architecture

## Frontend Architecture
- **Single Page Application (SPA)**: Built using vanilla JavaScript with jQuery for DOM manipulation and UI interactions
- **Responsive Design**: Bootstrap 4.4.1 framework with custom CSS for TV-optimized layouts
- **UI Components**: Modular page system with dedicated CSS and JavaScript files for each feature (homepage, channels, VOD, search, etc.)
- **TV Remote Control Support**: Custom key handling for both Samsung Tizen and LG WebOS remote controls
- **Media Player Integration**: Platform-specific video player implementations using native TV APIs

## Backend/API Integration
- **REST API Communication**: AJAX-based requests to external IPTV services
- **IPTV Protocol Support**: M3U playlist parsing and XTREME-style API integration
- **Authentication**: MAC address-based device authentication with playlist URL configuration
- **Data Models**: Dedicated model classes for Live TV, VOD, and Series content management

## Content Management
- **Multi-Category Support**: Live channels, movies, TV series with hierarchical organization
- **Favorites System**: User-customizable favorites lists with local storage persistence
- **Resume Playback**: Video position saving and restoration for interrupted viewing
- **EPG Integration**: Electronic Program Guide with catch-up TV functionality

## Local Storage Features
- **File Browser**: Native file system access for local media playback
- **Image Gallery**: Photo viewing with slideshow capabilities using PhotoBox plugin
- **Settings Persistence**: Local storage of user preferences, themes, and configurations

## External Service Integrations
- **YouTube Integration**: YouTube playlist and video playback support
- **Subtitle Support**: SRT subtitle parsing and display with synchronization
- **Multi-language Support**: Internationalization framework with language switching
- **Theme System**: Customizable UI themes with background image support

## Platform Compatibility
- **Cross-Platform Design**: Unified codebase with platform-specific adaptations
- **Samsung Tizen**: Native Tizen APIs for media playback and system integration
- **LG WebOS**: WebOS-specific implementations for TV functionality
- **Development Tools**: Build scripts for packaging and deployment to both platforms

# External Dependencies

## Core Libraries
- **jQuery 3.4.1**: DOM manipulation and AJAX requests
- **Bootstrap 4.4.1**: CSS framework for responsive design
- **Moment.js**: Date and time manipulation for EPG and scheduling
- **Slick Carousel**: Image and content slider functionality
- **Rangeslider.js**: Custom range input controls for video seeking

## TV Platform SDKs
- **Samsung Tizen SDK**: Platform-specific APIs via webapis object
- **LG WebOS SDK**: WebOS TV APIs and services integration
- **CAPH Framework**: Samsung's Smart TV application framework

## Media and UI Components
- **PhotoBox**: Image gallery and lightbox functionality
- **LazyLoad**: Optimized image loading for better performance
- **Velocity.js**: Hardware-accelerated animations
- **Hammer.js**: Touch gesture recognition (via CAPH framework)

## Development Tools
- **WebOS CLI Tools**: Application packaging and deployment for LG TVs
- **Node.js Build Tools**: Archiver for app packaging, Rimraf for cleanup
- **Tizen Studio**: Samsung TV application development and testing environment

## External Services
- **IPTV Providers**: M3U playlist and XTREME API endpoints
- **YouTube API**: Video streaming and playlist management
- **Subtitle Services**: SRT subtitle file parsing and synchronization
- **Content Delivery Networks**: Image and media asset hosting