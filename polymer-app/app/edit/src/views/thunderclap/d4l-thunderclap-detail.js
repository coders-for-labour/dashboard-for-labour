Polymer({
  is: 'd4l-thunderclap-detail',
  behaviors: [
    D4L.Logging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
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
    // this.$.fbPost.inputElement.selectionEnd = 0;
    // this.$.twPost.inputElement.selectionEnd = 0;
  },

});
