module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['inline-dotenv', { path: '.env' }],
    'react-native-reanimated/plugin',
  ],
};
