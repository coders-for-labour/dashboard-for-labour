Polymer({
  is: 'd4l-app',
  behaviors: [
    D4L.Logging,
    D4L.Helpers
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },

    app: {
      type: Object,
      value: function() {
        return {
          title: '%{D4L_APP_TITLE}%'
        };
      }
    },

    auth: {
      type: Object,
      notify: true
    },
    mode: {
      type: String,
      value: "authenticating"
    },

    db: {
      type: Object,
      notify: true
    },

    routes: {
      type: Object,
      value: function() {
        return {
          route: null,
          subroute: null,
          action: null,
          id: null
        }
      }
    },
    rootPath: String,
    __routesData: {
      type: Object,
      value: function() {
        return {
          route: {
            route: null,
            parts: null,
            active: false,
            queryParams: null
          },
          subroute: {
            route: null,
            parts: null,
            active: false
          },
          action: {
            route: null,
            parts: null,
            active: false
          },
          id: {
            route: null,
            parts: null,
            active: false
          }
        }
      }
    },

    __appRoute: {
      type: String,
      reflectToAttribute: true,
      observer: '__pageChanged',
    },
    pageFirstLoad: {
      type: Boolean,
      value: true
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
    '__authChanged(auth.status)',
    '__routePathChanged(__routesData.route.route.path, __routesData.route.queryParams)',
    '__routesRouteChanged(routes.route)',
  ],
  listeners: {
    'view-entity': '__viewEntity',
    'back-button-clicked': '__viewBack',
  },

  attached: function() {
    this.set('auth.status', 'begin');

    if (Sugar) {
      Sugar.Date.setLocale('en-GB');
    }
  },

  __authChanged: function() {
    if ( this.get('auth.status') !== "done") {
      return;
    }
  },

  __routePathChanged: function() {
    const route = this.get('__routesData.route');
    const subroute = this.get('__routesData.subroute');
    const action = this.get('__routesData.action');
    const id = this.get('__routesData.id');

    if (!route || !subroute || !action || !id) {
      return;
    }

    if (this.get('navDrawerOpened')) {
      this.set('navDrawerOpened', false);
    }

    if (route && route.active) {
      this.set('routes.route', route.parts.data);
    } else {
      this.set('routes.route', false);
    }
    if (subroute && subroute.active) {
      this.set('routes.subroute', subroute.parts.data);
    } else {
      this.set('routes.subroute', false);
    }
    if (action && action.active) {
      this.set('routes.action', action.parts.data);
    } else {
      this.set('routes.action', false);
    }
    if (id && id.active) {
      this.set('routes.id', id.parts.data);
    } else {
      this.set('routes.id', false);
    }
  },

  __routesRouteChanged: function(next) {
    const current = this.get('__appRoute');
    if (current && next === current) return;

    this.set('__appRoute', next || 'dashboard');
  },

  __pageChanged: function(page) {
    // Load page import on demand. Show 404 page if fails
    if(page === 'logout') {
      return window.location = '/logout';
    }

    Polymer.importHref(
      this.resolveUrl(`/src/views/${page}/d4l-${page}.html`),
      null,
      () => this.set('__appRoute', 'view404'),
      true
    );
  },
  __showPage404: function() {
    this.page = 'view404';
  },
  __backButton: function() {
    this.set('subroute.path', '');
  },

  __viewEntity: function(ev) {
    let path = ev.detail || ev;
    if (!path) return;

    if (path.indexOf('/') !== 0) {
      path = `/${path}`;
    }

    window.history.pushState({}, null, path);
    this.fire('location-changed');
  },
  __viewBack: function() {
    const routes = this.get('routes');
    const pageFirstLoad = this.get('pageFirstLoad');

    if(!pageFirstLoad && window.history.length > 0){
      return window.history.back();
    }

    if (routes.subroute) {
      this.__viewEntity(`/${routes.route}`);
      return;
    }

    this.__viewEntity('/');
  },

  __computeHideMenuButton: function() {
    return this.subroute.path ? true : false
  },
  __computeHideBackButton: function() {
    return this.subroute.path ? false : true
  }
});
