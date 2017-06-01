Polymer({
  is: 'd4l-twibbyn-campaign-card',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LCardBehavior
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
      notify: true
    },
    type: {
      type: String,
      value: 'twibbyn'
    },
    campaign: {
      type: Object
    },
    metadata: {
      type: Object,
      notify: true
    },
    isMobile: {
      type: Boolean,
      value: false
    },

    __selectedTwibbyn: {
      type: String,
      computed: '__computeSelectedTwibbyn(metadata.images, metadata)'
    },

    __selectedPlatform: {
      type: String,
      value: 'twitter'
    },
    __selectedProfileImg: {
      type: String,
      computed: '__computeSelectedProfileImg(auth.user, __selectedPlatform)'
    }

  },

  observers: [
    '__campaignChanged(campaign, db.campaign.data.*)'
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

  __computeSelectedTwibbyn: function(images){
    if (images.length > 0) {
      return images[0];
    }
  },

  __viewTwibbyn: function(){
    this.fire('view-entity', `/twibbyn/${this.get('campaign').id}`);
  },

  __computeSelectedProfileImg: function(user, platform) {
    let profile = user.profiles.find(p => p.app === platform);
    if (!profile) {
      profile = user.profiles[0];
    }

    if (profile.app === 'facebook') {
      return `https://graph.facebook.com/${profile.id}/picture?width=300`;
    }

    return profile.images.profile;
  },

});
