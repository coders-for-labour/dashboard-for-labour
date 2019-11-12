Polymer({
  is: 'd4l-issue-card',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Topic.Helpers,
    D4L.Issue.Helpers
  ],
  properties: {
    logLevel: {
      type: Number,
      value: 3
    },

    issue: {
      type: Object
    },

    topic: Object,
    __topicQuery: {
      type: Object,
      computed: '__computeTopicQuery(issue, db.topic.data.*)'
    },

    __isIssueEditor: {
      type: Boolean,
      value: false,
      computed: '__computeIsTopicEditor(topic, topic.topicId)'
    },

    __issueSummary: {
      type: String,
      value: '',
      computed: '__computeIssueSummary(issue, issue.description)'
    }
  },

  __viewIssue: function() {
    this.viewIssue(this.get('issue.id'));
  },
  __updateIssue: function() {
    this.updateIssue(this.get('issue'));
  },

  __computeIssueSummary: function() {
    const issue = this.get('issue');
    if (!issue || !issue.description) return '';
    return Sugar.String.truncate(issue.description, 140);
  },

  __computeTopicQuery(issue, cr) {
    if (!issue) {
      return;
    }

    return {
      __crPath: cr.path,
      id: {
        $eq: issue.topicId
      }
    };
  }
});