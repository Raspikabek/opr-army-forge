const {i18n} = require('./next-i18next.config');
if (false) {
  const withPWA = require("next-pwa");
  const runtimeCaching = require("next-pwa/cache");
  const {i18n} = require('./next-i18next.config');
  module.exports = withPWA({
    pwa: {
      dest: "public",
      runtimeCaching,
    },
    i18n
  });
}

module.exports = {i18n}