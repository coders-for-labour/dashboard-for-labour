Polymer({
  is: 'd4l-footer',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    footerLogo: {
      type: String,
      value: 'red'
    }
  },
});
