#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');

const outfile = process.argv[2];

if (!outfile) throw new Error('Usage: gen-manifest <outfile>');

const appinfo = require('../appinfo.json');
const ipkfile = `Release/${appinfo.id}_${appinfo.version}_all.ipk`;
const ipkhash = crypto
  .createHash('sha256')
  .update(fs.readFileSync(ipkfile))
  .digest('hex');

fs.writeFileSync(
  outfile,
  JSON.stringify({
    id: appinfo.id,
    version: appinfo.version,
    type: appinfo.type,
    title: appinfo.title,
    // appDescription: appinfo.appDescription,
    iconUri:
      'https://raw.githubusercontent.com/webosbrew/youtube-webos/main/assets/largeIcon.png',
    sourceUrl: 'https://github.com/webosbrew/youtube-webos',
    rootRequired: false,
    ipkUrl: ipkfile,
    ipkHash: {
      sha256: ipkhash
    }
  })
);