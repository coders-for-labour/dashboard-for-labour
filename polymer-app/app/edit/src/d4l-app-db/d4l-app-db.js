Polymer({
  is: 'd4l-app-db',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },
    auth: {
      type: Object
    },
    db: {
      type: Object,
      value: function() {
        return {
          post: {
            status: 'uninitialised',
            data: [],
            metadata: {}
          },
          user: {
            status: 'uninitialised',
            data: [],
            metadata: {}
          },
          campaign: {
            status: 'uninitialised',
            data: [],
            metadata: {}
          }
        }
      },
      notify: true
    }
  },
  observers: [
    '__auth(auth.user)',
  ],

  attached: function() {
  },

  __auth: function() {
    if (!this.auth.user){
      return;
    }
    this.__debug('app-db:auth');
    // if (this.get('db.org.status') === 'uninitialised') {
    //   this.set('db.org.status', 'initialise');
    // }

    // this.set('db.group.status', 'initialise');
    // this.set('db.app.status', 'initialise');
  },
});
