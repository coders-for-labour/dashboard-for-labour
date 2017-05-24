Polymer({
  is: "d4l-auth-service",
  behaviors: [
    Polymer.D4LLogging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 4
    },
    db: {
      type: Object,
      notify: true
    },
    status: {
      type: String,
      value: "idle",
      notify: true,
      observer: "_onStatusChanged"
    },
    auth: {
      type: Object,
      value: {
        user: null,
        metadata: null
      },
      notify: true
    }
  },
  attached: function() {
  },

  onAjaxResponse: function(ev, detail) {
    if (!detail.response) {
      this.status = "done";
      return;
    }
    this.set('auth.user', detail.response.user);
    this.status = "done";

    const userId = this.get('auth.user.id');
    if (!userId) {
      return;
    }

    let meta = this.get(['db.user.metadata', userId]);
    if (!meta) {
      const metaDefault = Object.assign({}, {
        __populate__: true,
        constituencyName: '',
        membershipNumber: '',
        postCode: '',
        postIds: []
      });
      this.set(['db.user.metadata', userId], metaDefault);
    }
    this.set('auth.metadata', this.get(['db.user.metadata', userId]));
    this.linkPaths('auth.metadata', `db.user.metadata.${userId}`);
  },

  onAjaxError: function() {
    this.status = "error";
  },

  _onStatusChanged: function() {
    this.__debug(`auth:${this.status}`);
    if (this.status === "begin") {
      this._generateAuthenticatedRequest();
    }
  },

  _generateAuthenticatedRequest: function() {
    this.$.authenticated.params = {
      urq: Date.now()
    };
    this.$.authenticated.generateRequest();
    this.status = "working";
  }
});
