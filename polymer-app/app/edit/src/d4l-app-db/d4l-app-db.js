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
    },
    __services: {
      type: Array,
      value: function() { return []; }
    }
  },
  observers: [
    '__auth(auth.user)',
  ],

  listeners: {
    'data-service-list': '__onDataLoaded'
  },

  attached: function() {
  },

  __auth: function() {
    if (!this.auth.user){
      return;
    }

    this.__services = Polymer.dom(this.root).querySelectorAll('d4l-data-service[not-loaded]');
    this.__services.sort((a,b) => a.priority - b.priority);
    this.__onDataLoaded();
  },

  __onDataLoaded: function(ev) {
    if (!ev) {
      this.__services[0].triggerGet();
      return;
    }

    let service = this.__services.findIndex(s => s === ev.detail);
    if (service !== -1) {
      this.__services.splice(service, 1);
    }

    if (!this.__services.length) {
      this.__debug('All loaded');
      return;
    }

    this.__services[0].triggerGet();
  }
});
