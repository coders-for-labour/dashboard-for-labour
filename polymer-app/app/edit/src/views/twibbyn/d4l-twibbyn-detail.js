Polymer({
  is: 'd4l-twibbyn-detail',
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
      type: Object
    },
    __selectedPlatform: {
      type: String,
      value: ''
    },
    __selectedProfileImg: {
      type: String,
      computed: '__computeSelectedProfileImg(auth.user.profiles.*, __selectedPlatform)'
    },
    twibbyns: {
      type: Array,
      computed: '__computeCampaignTwibbyns(metadata, metadata.images.*)'
    },
    __selectedTwibbyn: {
      type: String,
      notify: true
    },
    __twibbynPosition: {
      type: String,
    },
    __squareAvatar: {
      type: Boolean
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
    __twibbynEndpoint: {
      type: String,
      value: '//%{D4L_CDN_URL}%'
    },

    __twitterSaveUrlPrefix: {
      type: String,
      value: '/twibbyn/twitter/save'
    },

    __twibbynSaveUrl: {
      type: String
    },

    __fbGetTwibbynUrl: {
      type: String,
      computed: '__computeFbGetTwibbynUrl(__selectedTwibbyn, campaign, __twibbynPosition)'
    },

    __twibbynSaveBody: {
      type: Object
    }

  },

  observers: [
    '__campaignChanged(campaign, db.campaign.data.*)',
    '__authUser(auth.user.profiles.*)'
  ],

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

  __authUser: function() {
    let profiles = this.get('auth.user.profiles');
    if (!profiles || !profiles.length) {
      this.__warn('No user profiles!');
      return;
    }

    this.__selectedPlatform = profiles[0].app;
  },

  __connectTwitter: function() {
    window.location = '/auth/twitter';
  },
  __connectFacebook: function() {
    window.location = '/auth/facebook';
  },

  __selectTwitter: function() {
    this.set('__selectedPlatform', 'twitter');
    this.set('__twibbynPosition', 'center');
    this.set('__uploadStatus', 'ready');
    this.__silly(`Selected: ${this.__selectedPlatform}`);
  },

  __selectFacebook: function() {
    this.set('__selectedPlatform', 'facebook');
    this.set('__twibbynPosition', 'center');
    this.set('__uploadStatus', 'ready');
    this.__silly(`Selected: ${this.__selectedPlatform}`);
  },

  __selectTwibbyn: function (ev) {
    const twibbyn = ev.model.get('twibbyn');

    this.set('__selectedTwibbyn', twibbyn);
  },
  __nextTwibbyn: function() {
    const selected = this.get('__selectedTwibbyn');
    const twibbyns = this.get('twibbyns');
    let twibbynIndex = twibbyns.findIndex(t => t === selected);

    if (twibbynIndex >= (twibbyns.length - 1)) {
      twibbynIndex = 0
    } else {
      twibbynIndex++;
    }

    this.set('__selectedTwibbyn', this.get(`twibbyns.${twibbynIndex}`));
  },
  __prevTwibbyn: function() {
    const selected = this.get('__selectedTwibbyn');
    const twibbyns = this.get('twibbyns');
    let twibbynIndex = twibbyns.findIndex(t => t === selected);

    if (twibbynIndex < 1) {
      twibbynIndex = (twibbyns.length - 1);
    } else {
      twibbynIndex--;
    }

    this.set('__selectedTwibbyn', this.get(`twibbyns.${twibbynIndex}`));
  },

  __saveTwitter: function(){
    if (!this.checkAuthApp('twitter')) {
      this.__debug('No Twitter Auth');
      // Need to prompt the user probably
      window.location = '/auth/twitter';
      return;
    }

    const campaign = this.get('campaign');
    const selected = this.get('__selectedTwibbyn');
    let gravity = this.get('__twibbynPosition');
    if (gravity === 'center') {
      gravity = 'mid';
    }

    this.set('__uploadStatus', 'uploading');
    this.set('__twibbynSaveUrl', this.get('__twitterSaveUrlPrefix'));
    this.set('__twibbynSaveBody', {
      campaignId: campaign.id,
      file: selected,
      gravity: gravity
    });
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

      this.$.ajaxGetFbTwibbyn.generateRequest();
    }, {
      scope: 'publish_actions'
    });

    this.__debug('__saveFacebook');
  },

  __saveTwResponse: function(ev){
    this.__debug('__saveTwResponse', ev.detail.response);
    setTimeout(() => {
      this.set('__uploadStatus', 'uploaded');
    }, 2000);
  },

  __saveFbResponse: function(ev){
    this.__debug(ev.detail.response);
    FB.api('/me/photos', 'post', {
      url: `http://%{D4L_CDN_URL}%/c/${ev.detail.response.file}`,
      no_story: true
    }, response => {
      this.set('__uploadStatus', 'uploaded');
      if (!response.id) {
        this.__debug(response);
        this.__err('Failed to upload photo to Facebook');
        return;
      }

      this.set('__configureFacebookPhotoId', response.id);
    });
  },

  __finishedUpload: function() {
    this.set('__uploadStatus', 'ready');
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

  __computeCampaignTwibbyns: function(){
    const twibbyns = this.get('twibbyns');
    const metaImages = this.get('metadata.images');

    if (twibbyns !== metaImages) {
      if (metaImages && metaImages.length > 0) {
        this.set('__selectedTwibbyn', metaImages[0]);
      }
    }

    return metaImages;
  },

  __computeFbGetTwibbynUrl: function(selectedTwibbyn, campaign, position) {
    let gravity = position;
    if (gravity === 'center') {
      gravity = 'mid';
    }

    let url = `/twibbyn/facebook?file=${selectedTwibbyn}&campaign=${campaign ? campaign.id : -1}&gravity=${gravity}`;
    this.__silly(url);

    return url;
  },

  __computeSelectedProfileImg: function(cr, platform) {
    //user.profiles.0.images.profile
    let user = this.get('auth.user');
    if (!user) {
      return '';
    }
    let profile = user.profiles.find(p => p.app === platform);
    if (!profile) {
      profile = user.profiles[0];
    }

    if (profile.app === 'facebook') {
      return `https://graph.facebook.com/${profile.id}/picture?width=300`;
    }

    return profile.images.profile;
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
  },
});
