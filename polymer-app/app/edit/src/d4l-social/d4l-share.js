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

    __tweetBody: {
      type: Object,
      value: function() {
        return {
          tweet: '',
        };
      }
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

  __shareAmplify: function(){
    let user = this.get('auth.user');
    if (!user || !user.profiles.length) {
      this.__warn('No auth');
      return;
    }

    let postText = this.get('__shareText.fb');
    const url = 'https://amplify.labour.org.uk';
    this.set('__shareTwStatus', 'sharing');

    let authFb = user.profiles.find(p => p.app === 'facebook') !== -1;
    let authTw = user.profiles.find(p => p.app === 'twitter') !== -1;

    this.__debug(`AuthFb: ${authFb}`, `AuthTw: ${authTw}`);

    if (authFb && authTw) {
      this.__shareUrl(postText, url, (err, postResponse) => {
        if (err) {
          this.__err(err);
          this.set('__shareTwStatus', 'ready');
          return;
        }
        this.push('auth.metadata.postIds', {type: 'facebook', id: postResponse.id});
        postText = this.get('__shareText.tw');
        this.set('__tweetBody', {
          tweet: postText
        });
        this.set('__shareTwStatus', 'sharing');
        this.$.ajaxTweet.generateRequest();
      });
    } else {
      if (authFb) {
        this.__shareUrl(postText, url, (err, postResponse) => {
          if (err) {
            this.__err(err);
            this.set('__shareTwStatus', 'ready');
            return;
          }
          this.set('__shareTwStatus', 'shared');
          this.push('auth.metadata.postIds', {type: 'facebook', id: postResponse.id});
        });
      }
      if (authTw) {
        postText = this.get('__shareText.tw');
        this.set('__tweetBody', {
          tweet: postText
        });
        this.set('__shareTwStatus', 'sharing');
        this.$.ajaxTweet.generateRequest();
      }
    }
  },

  __shareAmplifyFb: function(){
    let postText = this.get('__shareText.fb');
    const url = 'https://amplify.labour.org.uk';
    this.set('__shareFbStatus', 'sharing');

    this.__shareUrl(postText, url, (err, postResponse) => {
      if (err) {
        this.__err(err);
        this.set('__shareFbStatus', 'ready');
        return;
      }
      this.set('__shareFbStatus', 'shared');
    });
  },

  __shareAmplifyTw: function(){
    let postText = this.get('__shareText.fb');
    this.set('__shareTwStatus', 'sharing');

    this.set('__tweetBody', {
      tweet: postText
    });
    this.set('__shareTwStatus', 'sharing');
    this.$.ajaxTweet.generateRequest();
  },
  __sharedTw: function() {
    this.set('__shareTwStatus', 'shared');
  },
  __sharedTwErr: function() {
    this.set('__shareTwStatus', 'ready');
    this.fire('appViewError', ev);
  },

  __computeDisableShareFb: function(status) {
    return status !== 'ready';
  },
  __computeShareFbButton: function(status) {
    let button = 'Share on Facebook';
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
    let button = 'Share on Twitter';
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
