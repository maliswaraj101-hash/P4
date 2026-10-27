import path from 'node:path'
import { Config } from '@remotion/cli/config'

// npm scripts run from video/, so cwd is the video project root.
const videoRoot = process.cwd()

Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(95)

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      // Files imported from ../src must resolve React from video/node_modules,
      // otherwise the site's copy gets bundled as a second React instance.
      // These must precede Remotion's `react` alias, which points at react/index.js.
      'react/jsx-runtime': path.join(videoRoot, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.join(videoRoot, 'node_modules/react/jsx-dev-runtime.js'),
      ...(config.resolve?.alias ?? {}),
      '@': path.resolve(videoRoot, '../src'),
    },
  },
}))
