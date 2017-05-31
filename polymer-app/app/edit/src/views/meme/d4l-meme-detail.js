Polymer({
  is: 'd4l-meme-detail',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 4
    },
    auth: {
      type: Object,
      notify: true
    },
    db: {
      type: Object,
      notify: true
    },
    metadata: {
      type: Object,
      notify: true
    },
    campaign: {
      type: Object,
      observer: '__campaignChanged'
    },
    __selectedPlatform: {
      type: String,
      value: '',
      observer: '__selectedPlatformChanged'
    },
    memes: {
      type: Array,
      computed: '__computeCampaignMemes(metadata, metadata.images.*)'
    },
    __selectedMeme: {
      type: String,
      notify: true
    },
    __postText: {
      type: Object,
      value: function() {
        return {
          fb: '\n#votelabour',
          tw: '\n#votelabour'
        }
      }
    },

    __tweetBody: {
      type: Object,
      value: function() {
        return {
          file: '',
          tweet: ''
        }
      }
    },

    __uploadStatus: {
      type: String,
      value: 'ready' // ready | uploading | uploaded
    },

    __hideReady: {
      type: Boolean,
      computed: '__computeHideReady(__uploadStatus)'
    },
    __hideUploading: {
      type: Boolean,
      computed: '__computeHideUploading(__uploadStatus)'
    },
    __hideUploaded: {
      type: Boolean,
      computed: '__computeHideUploaded(__uploadStatus)'
    },

    __configureFacebookPhotoId: {
      type: String,
      value: ''
    },
    __configureFacebookUrl: {
      type: String,
      computed: '__computeConfigureFacebookUrl(__configureFacebookPhotoId)'
    },
    __memeEndpoint: {
      type: String,
      value: '//%{D4L_CDN_URL}%'
    },


    __memeSaveUrl: {
      type: String
    },

    __fbGetMemeUrl: {
      type: String,
      computed: '__computeFbGetTwibbynUrl(__selectedTwibbyn)'
    },

    __memeSaveBody: {
      type: Object
    }

  },

  __campaignChanged: function(){
    const campaignId = this.get('campaign.id');

    if (!campaignId) {
      this.__silly('__campaignChanged', 'Trying to link paths with no campaign id');
      return;
    }

    let metaData = this.get(['db.campaign.metadata', campaignId]);
    if (!metaData) {
      this.__silly('__campaignChanged', 'Init default metadata for', campaignId);
      const metaDefault = Object.assign({}, {
        __populate__: true,
        images: []
      });
      this.set(['db.campaign.metadata', campaignId], metaDefault);
    }

    this.set('metadata', this.get(['db.campaign.metadata', campaignId]));
    this.__silly('__campaignChanged', 'metadata linking path for', campaignId);
    this.linkPaths('metadata', `db.campaign.metadata.${campaignId}`);
  },

  __selectedPlatformChanged: function() {
    this.$.fbPost.inputElement.selectionEnd = 0;
    this.$.twPost.inputElement.selectionEnd = 0;
  },

  __selectMeme: function (ev) {
    const meme = ev.model.get('meme');

    this.set('__selectedMeme', meme);
  },
  __nextMeme: function() {
    const selected = this.get('__selectedMeme');
    const memes = this.get('memes');
    let memeIndex = memes.findIndex(t => t === selected);

    if (memeIndex >= (memes.length - 1)) {
      memeIndex = 0
    } else {
      memeIndex++;
    }

    this.set('__selectedMeme', this.get(`memes.${memeIndex}`));
  },
  __prevMeme: function() {
    const selected = this.get('__selectedMeme');
    const memes = this.get('memes');
    let memeIndex = memes.findIndex(t => t === selected);

    if (memeIndex < 1) {
      memeIndex = (memes.length - 1);
    } else {
      memeIndex--;
    }

    this.set('__selectedMeme', this.get(`memes.${memeIndex}`));
  },

  __saveTwitter: function(){
    if (!this.checkAuthApp('twitter')) {
      this.__debug('No Twitter Auth');
      // Need to prompt the user probably
      window.location = '/auth/twitter';
      return;
    }

    this.set('__uploadStatus', 'uploading');
    this.set('__tweetBody', {
      file: this.get('__selectedMeme'),
      tweet: this.get('__postText.tw')
    });
    this.$.ajaxTweet.generateRequest();
  },
  __saveFacebook: function() {
    if (!this.checkAuthApp('facebook')) {
      this.__debug('No Facebook Auth');
      // Need to prompt the user probably
      window.location = '/auth/facebook';
      return;
    }
    this.set('__uploadStatus', 'uploading');

    FB.login(response => {
      this.__debug(response);
      if (response.status !== 'connected') {
        this.__warn('cancelled login');
        return;
      }

      let cdnUrl = this.get('__memeEndpoint');
      let image = this.get('__selectedMeme');
      FB.api('/me/photos', 'post', {
        url: `${cdnUrl}/${image}`,
        no_story: true
      }, response => {
        this.set('__uploadStatus', 'uploaded');
        if (!response.id) {
          this.__debug(response);
          this.__err('Failed to upload photo to Facebook');
          return;
        }

        FB.api('/me/feed', 'post', {
          message: this.get('__postText.fb'),
          object_attachment: response.id
        }, postResponse => {
          if (!postResponse.id) {
            this.__debug(postResponse);
            this.__err('Failed to post to Facebook');
            return;
          }

          this.push('auth.metadata.postIds', {type: 'facebook', id: postResponse.id});
        });
      });


    }, {
      scope: 'publish_actions'
    });
  },

  __saveTwResponse: function(ev){
    let response = ev.detail.response;
    this.__debug('__saveTwResponse', response);
    if (response.err) {
      this.__warn(response.res);
      this.set('__uploadStatus', 'uploaded');
      return;
    }

    this.push('auth.metadata.postIds', {type: 'twitter', id: response.res.tweetId});
    this.set('__uploadStatus', 'uploaded');
  },

  __fbFinishedUpload: function() {
    this.set('__uploadStatus', 'ready');
    this.set('__postText.fb', '\n#votelabour');
  },

  __twFinishedUpload: function() {
    this.set('__uploadStatus', 'ready');
    this.set('__postText.tw', '\n#votelabour');
  },

  __ajaxError: function(ev){
    this.__err(ev);
  },


  checkAuthApp: function(app) {
    let user = this.get('auth.user');
    if (!user) {
      return false;
    }

    return user.profiles.findIndex(a => a.app === app) !== -1;
  },

  __computeTwitterConnected: function() {
    return this.checkAuthApp('twitter');
  },

  __computeFacebookConnected: function() {
    return this.checkAuthApp('facebook');
  },

  __computeTwitterSelected: function(platform) {
    return platform === 'twitter';
  },

  __computeFacebookSelected: function(platform) {
    return platform === 'facebook';
  },

  __computeCampaignMemes: function(){
    const memes = this.get('memes');
    const metaImages = this.get('metadata.images');

    if (memes !== metaImages) {
      if (metaImages && metaImages.length > 0) {
        this.set('__selectedMeme', metaImages[0]);
      }
    }

    return metaImages;
  },

  __computeConfigureFacebookUrl: function(photoId) {
    return `https://www.facebook.com/photo.php?fbid=${photoId}`;
  },
  __computeHideReady: function(status) {
    return status === 'uploading' || status === 'uploaded';
  },
  __computeHideUploading: function(status) {
    return status === 'ready' || status === 'uploaded';
  },
  __computeHideUploaded: function(status) {
    return status === 'ready' || status === 'uploading';
  }

});
