#!/usr/bin/env node

const fs = require('fs');

const packageInfo = require('../package.json');
const appinfo = require('../appinfo.json');

fs.writeFileSync(
  'appinfo.json',
  `${JSON.stringify(
    {
      ...appinfo,
      version: packageInfo.version
    },
    null,
    4
  )}\n`
);