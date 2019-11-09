Polymer({
  is: 'd4l-dashboard',
  behaviors: [
    D4L.Logging,
    D4L.Issue.Helpers,
    Polymer.D4LViewList
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

    __pageTitle: {
      type: String,
      value: '%{D4L_APP_TITLE}%'
    },

    __users: {
      type: Array
    },
    __userQuery: {
      type: String,
      computed: '__computeUserQuery(db.people.data.*)'
    },

    __latestIssues: Array,
    __latestIssuesQuery: {
      type: Object,
      computed: '__computeLatestIssuesQuery(db.issue.data.*)'
    },

    __post: {
      type: Object,
      value: function () { return {}; }
    }
  },

  attached: function() {

  },

  __computeUserQuery: function(){
    return {
      // Fetch all records
    }
  },

  __computeLatestIssuesQuery() {
    return {
      
    };
  },

  __viewLatestIssue: function(ev) {
    const issue = ev.model.get('issue');
    this.fire('view-entity', `/issue/${issue.id}`);
  },

  __viewTwibbyn: function () {
    this.fire('view-entity', '/twibbyn');
  },
  __viewThunderclap: function () {
    this.fire('view-entity', '/thunderclap');
  },
  __viewTopics: function () {
    this.fire('view-entity', '/topic');
  },
  __viewMemes: function () {
    this.fire('view-entity', '/meme');
  }
});
