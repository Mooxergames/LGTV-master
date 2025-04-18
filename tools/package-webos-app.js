#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const rimraf = require('rimraf');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Files and directories to exclude from the package
  excludePatterns: [
    'build-tmp',
    '.vscode',
    '.git',
    '.sign',
    '^.csproj$',
    '^.externalToolBuilders$',
    '^.gn$',
    '^.obj$',
    '^.package$',
    'webOSTVjs-1.2.0/webOSTV-dev.js',
    'webOSTVjs-1.2.0/LICENSE-2.0.txt',
    'README.md',
    'node_modules',
    'package.json',
    'package-lock.json',
    '.settings',
    '.buildResult',
    '.wgt',
    'Build',
    'Release',
    'Debug',
    'Certficate',
    'tools',
    'lg-samsung-tv-apps.csproj',
    '.project',
    '.rds_delta',
    '.sdk_delta.info',
    '.rds_delta',
    '.tizen-ui-builder-tool.xml',
    '.tproject',
    'Directory.Build.targets',
    'webUnitTest',
  ],
  // Default output directory for the package
  outputDir: 'Release',
  // Default package name (will use package.json appname if available)
  defaultPackageName: 'flixiptv.player',
  // File extensions to include
  includeExtensions: ['.js', '.json', '.html', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot']
};

/**
 * Main function to package the WebOS application
 */
async function packageWebOSApp() {
  try {
    console.log('Starting WebOS app packaging process...');
    
    // Get application directory (current directory by default)
    const appDir = process.cwd();
    console.log(`Application directory: ${appDir}`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(appDir, config.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Try to read package.json for app name and version
    let appName = config.defaultPackageName;
    let appVersion = '1.0.0';
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));
      appName = packageJson.name || config.defaultPackageName;
      appVersion = packageJson.version || '1.0.0';
    } catch (err) {
      console.log('No package.json found or unable to parse. Using default app name and version.');
    }
    
    // Try to read appinfo.json for more accurate WebOS app details
    try {
      const appInfo = JSON.parse(fs.readFileSync(path.join(appDir, 'appinfo.json'), 'utf8'));
      appName = appInfo.id || appName;
      appVersion = appInfo.version || appVersion;
      console.log(`Found WebOS app ID: ${appName} (version ${appVersion})`);
    } catch (err) {
      console.log('No appinfo.json found or unable to parse. Using fallback app details.');
    }
    
    // Define output file name
    const outputFile = path.join(outputDir, `${appName}_${appVersion}.ipk`);
    
    // Remove existing output file if it exists
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
    
    // Create a temporary build directory
    const buildTmpDir = path.join(appDir, 'build-tmp');
    if (fs.existsSync(buildTmpDir)) {
      rimraf.sync(buildTmpDir);
    }
    fs.mkdirSync(buildTmpDir, { recursive: true });
    
    // Copy files to the build directory
    console.log('Copying app files and filtering unnecessary files...');
    copyFilesRecursively(appDir, buildTmpDir);
    
    // Check if ares-package is installed
    let useAresPackage = false;
    try {
      execSync('ares-package --version', { stdio: 'ignore' });
      useAresPackage = true;
      console.log('Found ares-package, will use WebOS CLI for packaging.');
    } catch (err) {
      console.log('ares-package not found, will create a zip archive instead.');
    }
    
    if (useAresPackage) {
      // Use WebOS CLI to create the package
      try {
        console.log('Creating IPK package with ares-package...');
        execSync(`ares-package ${buildTmpDir} --outdir ${outputDir}`, { stdio: 'inherit' });
        console.log(`WebOS IPK package created successfully: ${outputFile}`);
      } catch (err) {
        console.error('Error creating IPK package with ares-package:', err);
        useAresPackage = false; // Fall back to zip method
      }
    }
    
    if (!useAresPackage) {
      // Create a zip archive as fallback
      console.log('Creating ZIP archive as fallback...');
      const zipOutputPath = path.join(outputDir, `${appName}_${appVersion}.zip`);
      await createZipArchive(buildTmpDir, zipOutputPath);
      console.log(`ZIP archive created successfully: ${zipOutputPath}`);
    }
    
    // Clean up temporary build directory
    console.log('Cleaning up temporary files...');
    rimraf.sync(buildTmpDir);
    
    console.log('Packaging process completed successfully!');
  } catch (err) {
    console.error('Error in packaging process:', err);
    process.exit(1);
  }
}

/**
 * Copy files recursively from source to destination, excluding unwanted files
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyFilesRecursively(src, dest) {
  // Get all files and directories in the source
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Skip excluded files and directories
    if (config.excludePatterns.includes(entry.name)) {
      continue;
    }
    
    // Process directories
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyFilesRecursively(srcPath, destPath);
    } 
    // Process files
    else if (entry.isFile()) {
      // Check if file extension should be included
      const extension = path.extname(entry.name).toLowerCase();
      
      // If no specific extensions are defined or this extension is included
      if (config.includeExtensions.length === 0 || 
          config.includeExtensions.includes(extension) || 
          entry.name === 'appinfo.json' || 
          entry.name === 'package.json') {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Create a zip archive from a directory
 * @param {string} sourceDir - Source directory
 * @param {string} outputPath - Output zip file path
 * @returns {Promise} - Resolves when zip creation is complete
 */
function createZipArchive(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    // Create output stream
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      console.log(`Archive created: ${archive.pointer()} total bytes`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add files from directory
    archive.directory(sourceDir, false);
    
    // Finalize the archive
    archive.finalize();
  });
}

// Execute the main function
packageWebOSApp();