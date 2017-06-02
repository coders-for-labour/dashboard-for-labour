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
      type: Object,
      notify: true
    },

    __pageTitle: {
      type: String,
      value: 'Amplify'
    },

    __users: {
      type: Array
    },
    __userQuery: {
      type: String,
      computed: '__computeUserQuery(db.user.data.*)'
    },

    __post: {
      type: Object,
      value: function () { return {}; }
    }
  },

  attached: function() {

  },

  __computeUserQuery: function(){
    return {
      // Fetch all records
    }
  },

  __viewTwibbyn: function () {
    this.fire('view-entity', '/twibbyn');
  },
  __viewThunderclap: function () {
    this.fire('view-entity', '/storm');
  },
  __viewMemes: function () {
    this.fire('view-entity', '/meme');
  }
});
