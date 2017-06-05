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
      return_scopes: true,
      scope: 'publish_actions'
    });
  },
  __shareUrl: function(postText, url, cb) {
    FB.ui({
      method: 'share',
      quote: postText,
      href: url
    }, postResponse => {
      if (!postResponse || postResponse.error_message) {
        cb(new Error('Failed to post to Facebook'));
        return;
      }

      cb(null, postResponse);
    });
  }
};
