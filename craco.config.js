// craco.config.js

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add a rule to ignore the source map warnings for react-razorpay
      webpackConfig.ignoreWarnings = [
        // Keep existing warnings you might want to ignore
        ...(webpackConfig.ignoreWarnings || []),
        
        // Regex to specifically target the source map loading error from react-razorpay
        /Failed to parse source map from '.*\\node_modules\\react-razorpay\\src\\.*'/i,
      ];
      return webpackConfig;
    },
  },
};