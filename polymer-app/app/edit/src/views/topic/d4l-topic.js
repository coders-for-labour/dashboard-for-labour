
Polymer({
  is: 'd4l-topic',
  behaviors: [
    D4L.Logging,
    D4L.Helpers,
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

  __addIssue() {
    const selectedItem = this.get('__selectedItem');
    const dbFactory = this.get('db.Factory');
    const dialog = this.$.dialog;

    const issue = dbFactory.create('issue');

    const dialogInputs = {
      name: {
        label: 'Title',
        type: 'TEXT',
        default: issue.name
      },
      description: {
        label: 'Description',
        type: 'TEXTAREA',
        default: issue.description
      }
    };

    dialog.setMetadata({
      'title': 'Issue',
      'description': 'Add a new issue to the system',
      'action': 'Save',
    });
    
    return dialog.openDialog(this.parseInputSchema(dialogInputs))
      .then((result) => {
        if (!result.values.name) {
          throw new Error('Thunderclap requires a name');
        }

        issue.name = result.values.name;
        issue.description = result.values.description;

        if (selectedItem) {
          issue.topicId = selectedItem.id;
        }

        this.push('db.issue.data', issue);
      });
  },

  __viewIssue(ev) {
    const item = ev.model.get('item');
    
    this.fire('view-entity', `/issue/${item.id}`);
  },

  __computeTopicsQuery() {
    const selectedItem = this.get('__selectedItem');

    let parentId = null;
    if (selectedItem) {
      parentId = selectedItem.id;
    }

    return {
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