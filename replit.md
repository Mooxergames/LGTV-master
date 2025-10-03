# FLIX IPTV - WebOS TV Application

## Overview
This is a WebOS TV application for FLIX IPTV, designed primarily for LG Smart TVs. The application provides access to live TV, movies, series, and various media streaming features.

## Project Structure
- **Frontend**: HTML5 application with JavaScript, CSS
- **Server**: Node.js development server for testing
- **Target Platform**: WebOS TV (LG Smart TVs) and Samsung Tizen TVs
- **Port**: 5000 (frontend development server)

## Key Features
- Live TV streaming
- Movies and Series catalog
- Search functionality
- YouTube player integration
- Storage playback
- Multi-language support
- Parental controls
- EPG (Electronic Program Guide) support

## Technology Stack
- **Runtime**: Node.js
- **Frontend Libraries**: 
  - jQuery 3.4.1
  - Bootstrap 4.4.1
  - Slick carousel
  - LazyLoad for images
  - Moment.js for time handling
- **TV Platform SDKs**:
  - webOSTVjs-1.2.0 (for LG TVs)
  - Tizen support (for Samsung TVs)

## Development Setup
The development server is configured to run on port 5000 with proper cache control headers to ensure changes are immediately visible during development.

### Running the Application
The application is configured to run automatically via the workflow:
- **Workflow Name**: TV App Server
- **Command**: `node server.js`
- **URL**: The app is accessible via the webview preview

### Server Configuration
- **Host**: 0.0.0.0 (to support Replit's proxy environment)
- **Port**: 5000
- **Cache Control**: Disabled for development (no-cache headers)

## Building for Production
The project includes packaging tools for creating deployable packages:
- `npm run lg:package` - Package for LG WebOS
- `npm run sm:build` - Build for Samsung Tizen
- `npm run sm:pack` - Package for Samsung Tizen

## Dependencies
- archiver: For creating deployment packages
- rimraf: For cleaning build directories
- @webos-tools/cli: LG WebOS development tools

## Project Configuration Files
- `appinfo.json` - WebOS app configuration
- `package.json` - Node.js dependencies and scripts
- `config.xml` - Additional configuration for TV platforms
- `tizen_web_project.yaml` - Samsung Tizen project config

## Recent Changes
- **2025-10-03**: Imported from GitHub and configured for Replit environment
  - Added cache control headers to development server
  - Updated .gitignore with Node.js best practices
  - Configured workflow for automatic server startup
  - Set deployment configuration

## Notes
- This app is designed for TV platforms, so some features require TV-specific APIs (PalmServiceBridge, webapis) that are not available in regular browsers
- The app includes fallback modes for browser testing
- Video playback in browser may be limited due to TV-specific codecs and DRM
