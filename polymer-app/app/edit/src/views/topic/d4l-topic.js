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

    __isTopicEditor: {
      type: Boolean,
      computed: '__computeIsTopicEditor(__selectedItem, auth.token)'
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

  observers: [
    '__observeSelectedItem(__selectedItem)'
  ],
    
  __observeSelectedItem() {
    const ajax = this.$.ajax;

    const db = this.get('db.topic.data');
    if (!db) return;
    const selectedItem = this.get('__selectedItem');
    if (!selectedItem) return;
    const dbIdx = db.findIndex(t => t.id === selectedItem.id);
    if (dbIdx === -1) return;

    this.__silly('__observeSelectedItem', selectedItem);

    // Send request to bump the count
    return ajax.send({
      url: '/api/v1/topic/view',
      method: 'POST',
      contentType: 'application/json',
      body: {
        id: selectedItem.id
      }
    })
    .catch(err => this.__err(err));
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

  __computeIssuesQuery(cr) {
    const selectedItem = this.get('__selectedItem');

    if (!selectedItem) {
      return {
        __crPath: cr.path,
      };
    }

    return {
      __crPath: cr.path,
      topicId: {
        $eq: selectedItem.id
      }
    };
  },

  __updateTopic() {
    this.updateTopic(this.get('__selectedItem'));
  }
});
