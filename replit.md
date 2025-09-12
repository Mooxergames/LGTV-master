# Overview

FLIX IPTV is a Smart TV application designed primarily for LG WebOS and Samsung Tizen platforms. It's an IPTV streaming application that allows users to watch live TV channels, video on demand (VOD), TV series, and access various multimedia content through playlist URLs. The app features a MAC address-based authentication system and supports multiple content types including live streaming, catch-up TV, and YouTube integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Web-based TV App**: Built as a hybrid web application targeting Smart TV platforms (LG WebOS and Samsung Tizen)
- **Single Page Application**: Uses vanilla JavaScript with jQuery for DOM manipulation and UI interactions
- **Responsive Design**: CSS-based responsive layout optimized for TV screens (1920x1080 resolution)
- **Component-based Structure**: Modular JavaScript files for different pages and functionality (home, channels, VOD, series, etc.)

## Platform Detection & Compatibility
- **Multi-platform Support**: Automatic detection between Samsung Tizen and LG WebOS platforms
- **Feature Detection**: Different video players and APIs based on detected platform
- **Fallback Mechanisms**: Samsung compatibility mode for unknown environments

## Media Player Integration
- **Dual Player System**: 
  - Samsung: Uses Tizen's webapis.avplay for video playback
  - LG WebOS: Uses HTML5 video elements
- **Streaming Support**: HLS and other streaming protocols for live TV and VOD content
- **Subtitle Support**: SRT subtitle parsing and display functionality

## Navigation & User Interface
- **TV Remote Control**: Comprehensive key mapping for TV remote navigation (arrow keys, enter, back, etc.)
- **Focus Management**: Sophisticated focus handling system for TV interface navigation
- **Modal Systems**: Various modal dialogs for settings, search, and content selection

## Content Management
- **Category-based Organization**: Hierarchical content structure with categories for Live TV, Movies, and Series
- **Playlist Integration**: XTREME API and M3U playlist support for content loading
- **Search Functionality**: Real-time search across different content types
- **Favorites & Recent**: User preference tracking with local storage persistence

## Data Storage & Persistence
- **Local Storage**: User preferences, viewing history, and cached data stored locally
- **Settings Management**: Comprehensive settings system for user customization
- **Resume Functionality**: Video playback position tracking and resume capabilities

## Authentication & Security
- **MAC Address Authentication**: Device identification using MAC address
- **Trial System**: 7-day free trial mechanism
- **Parental Controls**: Adult content filtering with password protection

# External Dependencies

## IPTV Service Integration
- **FLIX API**: Primary backend service (flixapp.net/api) for user authentication and content management
- **XTREME API**: Standard IPTV playlist API for content metadata and streaming URLs
- **EPG Services**: Electronic Program Guide data integration for live TV schedules

## Third-party Libraries
- **jQuery 3.4.1**: DOM manipulation and AJAX requests
- **Bootstrap 4.4.1**: CSS framework for responsive design
- **Moment.js**: Date/time manipulation for scheduling and EPG
- **Slick Carousel**: Image and content carousel functionality
- **Font Awesome**: Icon library for UI elements
- **Photobox**: Image gallery viewing functionality

## Smart TV Platform APIs
- **Samsung Tizen**: 
  - tizen.tvinputdevice for remote control handling
  - webapis.avplay for video playback
  - tizen.systeminfo for device information
- **LG WebOS**: 
  - webOS service APIs for system integration
  - HTML5 media APIs for video playback

## Build Tools & Development
- **WebOS CLI Tools**: For LG WebOS app packaging and deployment
- **Archiver**: For creating application packages
- **Node.js Tools**: Build scripts and development utilities

## Content Delivery
- **YouTube API**: Integration for YouTube playlist and video playback
- **Image CDN**: External image hosting for thumbnails and artwork
- **Streaming Servers**: Various IPTV streaming endpoints for content delivery

## Development Environment
- **VS Code Configuration**: Debugging setup for Tizen and WebOS platforms
- **Certificate Management**: Code signing certificates for app store deployment