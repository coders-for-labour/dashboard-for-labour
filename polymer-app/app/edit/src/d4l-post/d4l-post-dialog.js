Polymer({
  is: 'd4l-post-dialog',
  behaviors: [
    D4L.Logging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 4,
    },
    open: {
      type: Boolean,
      value: false,
      notify: true,
      observer: '__onOpenChanged'
    },
    title: {
      type: String,
      value: 'Post'
    },
    text: {
      type: String,
      value: '',
    },

    hasTwitter: {
      type: Boolean
    },

    __text: {
      type: String,
      value: ''
    },
    __image: {
      type: String,
      value: ''
    },
    __hasImage: {
      type: Boolean,
      computed: '__computeHasImage(__image)'
    },
    __uploadResponse: {
      type: Object,
      value: function() {
        return {};
      }
    }
  },
  observers: [
    '__onUploadResponse(__uploadResponse.response)'
  ],

  __onOpenChanged: function() {
    this.__debug('__onOpenChanged', 'state', this.open);
    if (this.open) {
      this.__text = this.text;
      this.$.dialog.open();
    } else {
      this.$.dialog.close();
    }
  },

  __connectTwitter: function () {
    window.location = '/auth/twitter';
  },

  __onUploadResponse: function(response) {
    if (!response) {
      // this.__warn('Invalid response', response);
      return;
    }
    this.__debug(response);
    this.__image = response;
  },

  __save: function() {
    this.fire('save', {
      text: this.__text,
      image: this.__image
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
  },

  __computeHasImage: function(image) {
    this.__debug('__hasImage');
    return image ? true : false;
  }

});
