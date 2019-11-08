Polymer({
  is: 'd4l-topic',
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
      value: 'Topics'
    },

    __topics: Array,
    __topicsQuery: {
      type: Object,
      computed: '__computeTopicsQuery(db.topic.data.*, __selectedItem)'
    },

    __issues: Array,
    __issuesQuery: {
      type: Object,
      computed: '__computeIssuesQuery(db.issue.data.*, __selectedItem)'
    },

    __hasSelectedItem: {
      type: Boolean,
      value: false,
      computed: 'computeIsSet(__selectedItem)'
    }
  },

  __computeTopicsQuery(cr) {
    const selectedItem = this.get('__selectedItem');

    let parentId = null;
    if (selectedItem) {
      parentId = selectedItem.id;
    }

    return {
      __crPath: cr.path,
      parentId: {
        $eq: parentId
      }
    };
  },

  __computeIssuesQuery() {
    const selectedItem = this.get('__selectedItem');

    if (!selectedItem) {
      return;
    }

    return {
      topicId: {
        $eq: selectedItem.id
      }
    };
  }
});