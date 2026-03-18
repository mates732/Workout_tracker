const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const importedAppRoot = path.resolve(projectRoot, "Workout_tracker", "fitness_coach_app", "frontend");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), importedAppRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: path.resolve(projectRoot, "node_modules", "react"),
  "react-native": path.resolve(projectRoot, "node_modules", "react-native"),
};

module.exports = config;
