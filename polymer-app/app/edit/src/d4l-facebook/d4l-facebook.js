/**
 * @polymerBehavior Polymer.D4LFacebook
 */
Polymer.D4LFacebook = {
  properties: {
  },

  __sharePhoto: function(photoUrl, postText, cb) {
    FB.login(response => {
      this.__debug(response);
      if (response.status !== 'connected') {
        cb(new Error('login_cancelled'));
        return;
      }

      FB.api('/me/photos', 'post', {
        url: photoUrl,
        no_story: true
      }, response => {
        if (!response.id) {
          this.__err(response);
          cb(new Error('Failed to upload photo to Facebook'));
          return;
        }

        FB.api('/me/feed', 'post', {
          message: postText,
          object_attachment: response.id
        }, postResponse => {
          if (!postResponse.id) {
            this.__err(postResponse);
            cb(new Error('Failed to post to Facebook'));
            return;
          }

          cb(null, postResponse);
        });
      });
    }, {
      scope: 'publish_actions'
    });
  },
  __shareUrl: function(postText, url, cb) {
    FB.login(response => {
      this.__debug(response);
      if (response.status !== 'connected') {
        cb(new Error('login_cancelled'));
        return;
      }

      FB.api('/me/feed', 'post', {
        url: url,
        message: postText,
      }, response => {
        if (!response.id) {
          this.__err(response);
          cb(new Error('Failed to upload photo to Facebook'));
          return;
        }

        cb(null, response);

      });
    }, {
      scope: 'publish_actions'
    });
  }
};
