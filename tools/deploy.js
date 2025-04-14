const { spawnSync } = require('node:child_process');
const { normalize } = require('node:path');

process.exit(
  spawnSync(
    normalize('./node_modules/.bin/ares-install'),
    [
      normalize(
        `./flixiptv.player_${process.env.npm_package_version}_all.ipk`
      )
    ],
    { stdio: 'inherit', shell: true }
  ).status ?? 0
);