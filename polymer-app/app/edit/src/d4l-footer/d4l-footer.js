Polymer({
  is: 'd4l-footer',
  behaviors: [
    D4L.Logging
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
