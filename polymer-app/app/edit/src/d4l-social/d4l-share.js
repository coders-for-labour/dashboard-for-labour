/**
 * @polymerBehavior Polymer.D4LShare
 */
Polymer.D4LShare = {
  properties: {
    __shareText: {
      type: Object,
      value: function() {
        return {
          fb: 'I\'ve just Amplified Labour! https://amplify.labour.org.uk #votelabour',
          tw: 'I\'ve just Amplified Labour! https://amplify.labour.org.uk #votelabour'
        };
      }
    },
    __shareFbStatus: {
      type: String, // (ready|sharing|shared)
      value: 'ready'
    },
    __shareTwStatus: {
      type: String, // (ready|sharing|shared)
      value: 'ready'
    },

    __disableShareFb: {
      type: Boolean,
      computed: '__computeDisableShareFb(__shareFbStatus)'
    },
    __shareFbButton: {
      type: String,
      computed: '__computeShareFbButton(__shareFbStatus)'
    },
    __disableShareTw: {
      type: Boolean,
      computed: '__computeDisableShareTw(__shareTwStatus)'
    },
    __shareTwButton: {
      type: String,
      computed: '__computeShareTwButton(__shareTwStatus)'
    }
  },

  __computeDisableShareFb: function(status) {
    return status !== 'ready';
  },
  __computeShareFbButton: function(status) {
    let button = 'Share Now';
    switch (status) {
      case 'sharing':
        button = 'Sharing...';
        break;
      case 'shared':
        button = 'Shared';
        break;
    }
    return button;
  },

  __computeDisableShareTw: function(status) {
    return status !== 'ready';
  },
  __computeShareTwButton: function(status) {
    let button = 'Share Now';
    switch (status) {
      case 'sharing':
        button = 'Sharing...';
        break;
      case 'shared':
        button = 'Shared';
        break;
    }
    return button;
  }
};
