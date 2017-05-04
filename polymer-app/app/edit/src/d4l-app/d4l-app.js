Polymer({
  is: 'd4l-app',
  behaviors: [
    Polymer.D4LLogging,
    Polymer.D4LRealtimeDbMsgHandler
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },

    auth: {
      type: Object,
      value: {
        user: null,
      },
      notify: true
    },
    authStatus: {
      type: String,
      value: "idle",
    },
    mode: {
      type: String,
      value: "authenticating"
    },

    db: {
      type: Object,
      notify: true
    },
    io: {
      type: Object,
      value: function() {
        return {
          endpoint: '',
          connected: false,
          tx: [],
          rxEvents: [
            'add-user',
            'message',
            'chat',
            'rm-user'
          ],
          rx: []
        };
      }
    },
    iodb: {
      type: Object,
      value: function() {
        return {
          endpoint: '',
          connected: false,
          rxEvents: [
            'db-activity'
          ],
          rx: []
        };
      }
    },

    route: {
      type: Object
    },
    routeData: {
      type: Object,
      observer: '__routePageChanged'
    },
    subroute: {
      type: Object
    },
    subrouteData: {
      type: Object,
      observer: '__subrouteChanged'
    },
    subrouteAction: {
      type: Object
    },
    subrouteActionData: {
      type: Object
    },
    subrouteActionId: {
      type: Object
    },
    subrouteActionIdData: {
      type: Object
    },

    page: {
      type: String,
      reflectToAttribute: true,
      observer: '__pageChanged'
    },
    pageMode: {
      type: String
    },
    pageFirstLoad: {
      type: Boolean,
      value: true
    },
    subPageTitle: {
      type: String
    },
    mainTitle: {
      type: String,
      computed: '__computeMainTitle(page)'
    },

    __hideMenuButton: {
      type: Boolean,
      computed: '__computeHideMenuButton(subroute.path)'
    },
    __hideBackButton: {
      type: Boolean,
      computed: '__computeHideBackButton(subroute.path)'
    }
  },

  observers: [
    '__authChanged(authStatus)',
    '__dbConnected(iodb.connected)',
    '__ioConnected(io.connected)'
  ],
  listeners: {
    'view-entity': '__viewEntity'
  },

  attached: function() {
    this.authStatus = "begin";
  },

  __authChanged: function() {
    if ( this.authStatus !== "done") {
      return;
    }
    this.__silly(this.auth.user);
    if (this.auth.user) {
      this.mode = "application";
    } else {
      this.mode = "authenticate";
    }
  },

  __dbConnected: function(connected) {
    this.__debug(`db: connected: ${connected}`);
  },
  __ioConnected: function(connected) {
    this.__debug(`io: connected: ${connected}`);
    if (connected !== true) {
      return;
    }

    this.push('io.tx', {type: 'add-user', payload: {userId: this.get('auth.user.id')}});
  },
  __dbRxEvent: function(ev) {
    let authUser = this.get('auth.user');
    if (!authUser) {
      return;
    }

    this.__handleRxEvent(ev, authUser);
  },
  __rxEvent: function(ev) {
    let type = ev.detail.type;
    let payload = ev.detail.payload;
    if (payload.userId === this.get('auth.user.id')) {
      return;
    }
    this.__debug(`receiving message: ${type}`);
    this.__debug(payload);

    let user = this.db.user.data.find(u => u.id == payload.userId);
    switch (type) {
      default: {
        this.__err(new Error('SocketIO: Unhandled message type'));
      } break;
      case 'chat': {
        if (this.chats.length > 0) {
          this.push('chats.0.messages', {
            user: user,
            text: payload.text,
            timestamp: payload.timestamp,
          });
        }
      } break;
      case 'message': {
      } break;
      case 'add-user': {
        if (user && user.person) {
          this.fire('create-action-toast', {
            label: '',
            text: `${user.person.name} just connected...`
          });
        }
      } break;
      case 'rm-user': {
        if (user && user.person) {
          this.fire('create-action-toast', {
            label: '',
            text: `${user.person.name} just left...`
          });
        }
      } break;
    }
  },
  __dataServiceError: function(ev) {
    this.__silly(ev);

    this.fire('create-action-toast', {
      label: '',
      text: ev.detail.error.message
    });
  },

  __routePageChanged: function(data, prevData) {
    const page = data.page;

    if(prevData && data.page !== prevData.page && this.pageFirstLoad){
      this.__debug('No longer first load');
      this.pageFirstLoad = false;
    }

    this.page = page || 'dashboard';
    this.navDrawerOpened = false;
    this.chatDrawerOpened = false;
  },
  __subrouteChanged: function(data, prevData) {
    const id = data.id;
    if (!id) {
      return;
    }

    if(prevData && data.id !== prevData.id && this.pageFirstLoad){
      this.pageFirstLoad = false;
    }

    this.navDrawerOpened = false;
    this.chatDrawerOpened = false;
  },

  __pageChanged: function(page) {
    // Load page import on demand. Show 404 page if fails
    if(page === 'logout') {
      return window.location = '/logout';
    }

    let resolvedPageUrl = this.resolveUrl(`../views/${page}/d4l-${page}.html`);
    this.importHref(resolvedPageUrl, null, this.__showPage404, true);
  },
  __showPage404: function() {
    this.page = 'view404';
  },
  __backButton: function() {
    this.set('subroute.path', '');
  },

  __viewEntity: function(ev) {
    let path = ev.detail;
    if (!path) {
      return;
    }

    this.set('route.path', path);
  },

  __computeMainTitle: function(page) {
    if (this.subPageTitle) {
      return this.subPageTitle;
    }
    let titles = {
      'dashboard': 'Dashboard For Labour'
    };
    if (!page || !titles[page]) {
      return 'Admin';
    }
    return titles[page];
  },
  __computeHideMenuButton: function() {
    return this.subroute.path ? true : false
  },
  __computeHideBackButton: function() {
    return this.subroute.path ? false : true
  }
});
