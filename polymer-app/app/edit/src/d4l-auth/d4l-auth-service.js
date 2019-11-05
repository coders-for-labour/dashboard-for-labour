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
        token: null
      },
      notify: true
    }
  },

  onAjaxResponse: function(ev, detail) {
    if (!detail.response) {
      this.status = "done";
      return;
    }
    this.set('auth.user', detail.response.user);
    this.status = "done";

    const user = this.get('auth.user');
    if (!user || !user.id) {
      return;
    }

    if (!user.tokens || user.tokens.length < 1) {
      return;
    }

    this.set('auth.token', user.tokens[0]);
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
