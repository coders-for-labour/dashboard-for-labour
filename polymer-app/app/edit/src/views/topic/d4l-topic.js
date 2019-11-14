Polymer({
  is: 'd4l-topic',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
    D4L.Topic.Helpers,
    D4L.Issue.Helpers,
    D4L.Thunderclap.Helpers,
    Polymer.D4LViewList
  ],
  properties: {
    db: {
      type: Object
    },

    logLevel: {
      type: Number,
      value: 3,
    },

    __pageTitle: {
      type: String,
      value: 'Topics'
    },

    __isTopicEditor: {
      type: Boolean,
      value: false,
      computed: '__computeIsTopicEditor(__selectedItem, auth.token)'
    },
    __hasTopicEditor: {
      type: Boolean,
      value: true,
      computed: '__computeHasTopicEditor(__selectedItem)'
    },

    __topics: Array,
    __topicsQuery: {
      type: Object,
      computed: '__computeTopicsQuery(db.topic.data.*, __selectedItem)'
    },

    parent: Object,
    __parentQuery: {
      type: Object,
      computed: '__computeParentQuery(__selectedItem, db.issue.data.*)'
    },

    __issues: Array,
    __issuesQuery: {
      type: Object,
      computed: '__computeIssuesQuery(db.issue.data.*, __selectedItem)'
    },

    __thunderclap: Array,
    __thunderclapQuery: {
      type: Object,
      computed: '__computeThunderclapQuery(db.thunderclap.data.*, __selectedItem)'
    },

    __topicBanner: {
      type: String,
      value: '',
      computed: '__computeTopicBanner(__selectedItem.banner)'
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

  __addTopicThunderclap() {
    const selectedItem = this.get('__selectedItem');
    const thunderclap = this.get('db.Factory').create('thunderclap');

    if (selectedItem) {
      thunderclap.topicId = selectedItem.id;
    }

    return this.addThunderclap(thunderclap);
  },

  __addTopicIssue() {
    const selectedItem = this.get('__selectedItem');
    const issue = this.get('db.Factory').create('issue');

    if (selectedItem) {
      issue.topicId = selectedItem.id;
    }

    return this.addIssue(issue);
  },

  __addTopic() {
    const selectedItem = this.get('__selectedItem');
    const topic = this.get('db.Factory').create('topic');

    if (selectedItem) {
      topic.parentId = selectedItem.id;
    }

    return this.addTopic(topic);
  },

  __computeTopicBanner() {
    const selectedItem = this.get('__selectedItem');
    if (selectedItem && selectedItem.banner) {
      return selectedItem.banner;
    }

    return '/images/homepage/homepage-01.jpg';
  },

  __computeThunderclapQuery: function () {
    const topic = this.get('__selectedItem');
    if (!topic) return;

    return {
      topicId: {
        $eq: topic.id
      },
      scheduledExecution: {
        $gtDate: Sugar.Date.create('now')
      }
    }
  },

  __computeTopicsQuery(cr) {
    const isAdminSuper = this.inAuthRole(this.get('auth.token'), 'admin.super');
    const isTopicEditor = this.get('__isTopicEditor');
    const selectedItem = this.get('__selectedItem');

    let parentId = null;
    if (selectedItem) {
      parentId = selectedItem.id;
    }
    
    const $and = [];

    if (!isAdminSuper && !isTopicEditor) {
      $and.push({
        published: {
          $eq: true
        }
      });
    }

    return {
      __crPath: cr.path,
      parentId: {
        $eq: parentId
      },
      $and: $and
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
