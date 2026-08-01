// Monorepo metro config — single React instance, resolve from this app first.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Admin (Next.js) hoists a newer React to the workspace root; pin mobile to ITS React.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  scheduler: path.resolve(projectRoot, 'node_modules/scheduler'),
};
config.resolver.disableHierarchicalLookup = true;
module.exports = config;
