const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  stream: require.resolve('readable-stream'),
  ws:     require.resolve('react-native/Libraries/WebSocket/WebSocket'),
  net:    false,
  tls:    false,
  fs:     false,
};

module.exports = config;