Polymer({
  is: "d4l-auth-service",
  behaviors: [
    D4L.Logging
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
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
