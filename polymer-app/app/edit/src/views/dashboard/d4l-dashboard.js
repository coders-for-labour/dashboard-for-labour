Polymer({
  is: 'd4l-dashboard',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LViewList
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    auth: {
      type: Object
    },

    __post: {
      type: Object,
      value: function () { return {}; }
    },
  },

  attached: function() {

  },

  __viewTwibbyn: function () {
    this.fire('view-entity', '/twibbyn');
  },
  __viewThunderclap: function () {
    this.fire('view-entity', '/thunderclap');
  },
  __viewMemes: function () {
    this.fire('view-entity', '/memes');
  }
});
