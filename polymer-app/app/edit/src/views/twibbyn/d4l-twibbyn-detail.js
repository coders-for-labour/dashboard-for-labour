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

    let metaData = this.get(['db.campaign.metadata', campaignId])
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
    this.__debug(ev);
  },
  __ajaxError: function(ev){

  },


  __nextTwibbyn: function() {
    const selected = this.get('__selectedTwibbyn');
    const twibbyns = this.get('twibbyns');
    let twibbynIndex = twibbyns.findIndex(t => t === selected);

    if (twibbynIndex >= (twibbyns.length - 1)) {
      twibbynIndex = (twibbyns.length - 1);
    } else {
      twibbynIndex++;
    }

    this.set('__selectedTwibbyn', this.get(`twibbyns.${twibbynIndex}`));
  },

  __prevTwibbyn: function() {
    const selected = this.get('__selectedTwibbyn');
    const twibbyns = this.get('twibbyns');
    let twibbynIndex = twibbyns.findIndex(t => t === selected);

    this.__warn(twibbynIndex);

    if (twibbynIndex < 1) {
      twibbynIndex = 0;
    } else {
      twibbynIndex--;
    }

    this.set('__selectedTwibbyn', this.get(`twibbyns.${twibbynIndex}`));
  },

  __saveTwitter: function(){
    const selected = this.get('__selectedTwibbyn');

    this.set('__twibbynSaveUrl', this.get('__twitterSaveUrlPrefix'));
    this.set('__twibbynSaveBody', {
      file: selected
    });
  },
  __saveFacebook: function(){
    this.__debug('__saveFacebook');
  },

  __computeCampaignTwibbyns: function(){
    return this.get('metadata.images');
  }

});
