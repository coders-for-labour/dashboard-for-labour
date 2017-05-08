Polymer({
  is: 'd4l-twibbyn-detail',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 6
    },
    db: {
      type: Object,
      notify: true
    },
    auth: {
      type: Object
    },
    campaign: {
      type: Object
    }
  }

});
