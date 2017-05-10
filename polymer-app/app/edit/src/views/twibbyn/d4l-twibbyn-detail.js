Polymer({
  is: 'd4l-twibbyn-detail',
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 6
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
    twibbyns: {
      type: Array,
      computed: '__computeCampaignTwibbyns(metadata, metadata.images.*)'
    },
    __selectedTwibbyn: {
      type: String,
      notify: true
    },

    __savingAvatar: {
      type: Boolean,
      notify: true,
      value: false
    },

    __twibbynEndpoint: {
      type: String,
      value: 'http://cdn.forlabour.com/'
    },

    __twitterSaveUrlPrefix: {
      type: String,
      value: '/twibbyn/twitter/save'
    },

    __twibbynSaveUrl: {
      type: String
    },

    __twibbynSaveBody: {
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

  __saveResponce: function(ev){
    setTimeout(() => {
      this.set('__savingAvatar', false);
    }, 25000);
  },
  __ajaxError: function(ev){
    this.__err(ev);
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
    const selected = this.get('__selectedTwibbyn');

    this.set('__savingAvatar', true);
    this.set('__twibbynSaveUrl', this.get('__twitterSaveUrlPrefix'));
    this.set('__twibbynSaveBody', {
      file: selected
    });
  },
  __saveFacebook: function(){
    this.__debug('__saveFacebook');
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
  }

});
