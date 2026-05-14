// metro.config.js
// Necessário para resolver corretamente os módulos do Firebase no Expo SDK 52
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase usa exports de pacotes modernos — garante resolução correta
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
