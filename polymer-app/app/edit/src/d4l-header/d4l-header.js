Polymer({
  is: 'd4l-header',
  behaviors: [
    Polymer.D4LLogging
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
      type: Object
    },
    mode: {
      type: String,
      value: 'detail'
    },
    page: {
      type: String,
      observer: '__page'
    },
    pageTitle: {
      type: String
    },
    responsivePageTitle: {
      type: String,
      computed: '__computeResponsivePageTitle(pageTitle, isMobile)'
    },
    pageMode: {
      type: String
    },
    header: {
      type: Object,
      notify: true
    },
    overflowDropdownOpen: {
      type: Boolean,
      value: false
    },
    isMobile: {
      type: Boolean,
      value: false
    }
  },

  observers: [
  ],

  __page: function() {
    Polymer.updateStyles();
  },

  __computeResponsivePageTitle: function(title, isMobile) {
    return !isMobile ? Sugar.String.truncate(title, 35) : Sugar.String.truncate(title, 17);
  }

});
