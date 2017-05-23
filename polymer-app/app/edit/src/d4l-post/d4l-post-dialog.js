Polymer({
  is: 'd4l-post-dialog',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 4,
    },
    title: {
      type: String,
      value: 'Post'
    },
    text: {
      type: String,
      value: '',
    },
    open: {
      type: Boolean,
      value: false,
      notify: true,
      observer: '__onOpenChanged'
    },
  },
  listeners: {
    'rm-document': '__rmDocument'
  },

  __onOpenChanged: function() {
    this.__debug('__onOpenChanged', 'state', this.open);
    if (this.open) {
      this.$.dialog.open();
    } else {
      this.$.dialog.close();
      this.__note = '';
    }
  },

  __send: function() {
    this.fire('send', {
      post: this.text,
    });
    this.open = false;
  },

  __closeDialog: function() {
    this.open = false;
  },
  __dialogClosed: function(ev) {
    if (ev.target === this.$.dialog) {
      this.open = false;
    }
  }

});
