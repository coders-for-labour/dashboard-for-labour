Polymer({
  is: 'd4l-socket-io',
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
    endpoint: {
      type: String,
      value: 'localhost'
    },
    connected: {
      type: Boolean,
      value: false,
      notify: true
    },
    rxEvents: {
      type: Array,
      value: function() {
        return [];
      }
    },
    tx: {
      type: Array,
      value: function() {
        return [];
      }
    },
    rx: {
      type: Array,
      value: function() {
        return [];
      }
    }
  },

  observers: [
    '__auth(auth.user)',
    '__tx(tx.splices)'
  ],

  attached: function() {
  },

  __auth: function() {
    if (!this.auth.user) {
      // io.disconnect();
      return;
    }

    this.connect();
  },

  connect: function() {
    try {
      this.socket = io.connect(this.endpoint);
      this.socket.on('connect',() => {
        this.connected = true;
        this.__configureRxEvents();
      });
      this.socket.on('disconnect',() => {
        this.connected = false;
      });
    } catch (err) {
      this.fire('error', err);
    }
  },

  __configureRxEvents: function() {
    this.rxEvents.forEach(ev => {
      this.socket.on(ev, (data) => {
        this.__debug('rxEvents:');
        this.__debug(data);
        this.fire('rx-event', Object.assign({}, { type: ev, payload: data }));
      });
    });
  },

  __tx: function(cr) {
    if (!this.socket) {
      return;
    }

    this.__debug(cr);

    cr.indexSplices.forEach(i => {
      if (i.type !== 'splice' || i.addedCount === 0) {
        return;
      }
      this.__debug('tx.added');

      for (let x=0; x<i.addedCount; x++) {
        let o = i.object[x+i.index];
        this.__debug(`emitting: ${o.type}`);
        this.socket.emit(o.type, o.payload);
      }
    });

  },
});
