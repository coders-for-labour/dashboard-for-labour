
Polymer({
  is: 'd4l-issue',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Topic.Helpers,
    D4L.Issue.Helpers,
    Polymer.D4LViewList
  ],
  properties: {
    db: {
      type: Object
    },

    __pageTitle: {
      type: String,
      value: 'Issues'
    },

    topic: Object,
    __topicQuery: {
      type: Object,
      computed: '__computeTopicQuery(__selectedItem, db.issue.data.*. db.topic.data.*)'
    },

    __hasSelectedItem: {
      type: Boolean,
      value: false,
      computed: 'computeIsSet(__selectedItem)'
    }
  },

  __viewTopic() {
    this.viewTopic(this.get('__selectedItem.topicId'));
  },
  __computeTopicQuery() {
    const issue = this.get('__selectedItem');
    this.__debug(`__computeTopicQuery`, issue);
    if (!issue) return null;
    return {
      id: {
        $eq: issue.topicId
      }
    };
  },
});