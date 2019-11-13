Polymer({
  is: 'd4l-dashboard-card',
  behaviors: [
    D4L.Logging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    hero: {
      type: Boolean,
      default: false
    },
    background: {
      type: String,
      notify: true
    },
    disabled: {
      type: String,
      notify: true
    }
  }
});