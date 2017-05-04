/**
 * @polymerBehavior Polymer.D4LViewList
 */
Polymer.D4LViewList = {
  properties: {
    auth: {
      type: Object
    },
    name: {
      type: String
    },
    title: {
      type: String,
      value: ''
    },
    route: {
      type: Object,
      notify: true
    },
    routeData: {
      type: Object,
      notify: true
    },
    subroute: {
      type: Object,
      notify: true
    },
    subrouteData: {
      type: Object,
      notify: true
    },
    subrouteAction: {
      type: Object,
      notify: true
    },
    subrouteActionData: {
      type: Object,
      notify: true
    },
    doc: {
      type: Object,
      notify: true
    },
    db: {
      type: Object,
      notify: true
    },
    subPageTitle: {
      type: String,
      computed: '__computeSubPageTitle(__selectedItem)',
      notify: true
    },
    isMobile: {
      type: Boolean,
      value: false
    },
    __loadMode: {
      type: String,
      value: 'loading'
    },
    __pageMode: {
      type: String,
      value: 'list'
    },
    __subPageMode: {
      type: String,
      computed: '__computeSubPageMode(subroute.path, subrouteAction.path)'
    },
    __subPageModeId: {
      type: String,
      computed: '__computeSubPageModeId(subroute.path, subrouteAction.path)'
    },
    __mode: {
      type: String,
      value: ''
    },
    __fab: {
      type: Object
    },
    __rmItemDialog: {
      type: Object
    },
    __editItemDialog: {
      type: Object
    },
    __dialogOpen: {
      type: Boolean,
      computed: '__computeDialogOpen(__mode)'
    },
    __dialogTitle: {
      type: String,
      computed: '__computeDialogTitle(title, __mode)'
    },
    __dialogSubmitTitle: {
      type: String,
      computed: '__computeDialogSubmitTitle(__mode)'
    },
    __selectedItem: {
      type: Object,
      value: {},
      notify: true
    },
    __selectedItemIndex: {
      type: Number,
      value: -1,
      notify: true,
    },
    __editItem: {
      type: Object,
      value: {}
    }
  },
  observers: [
    '__authStatus(auth.user)',
    '__docStatus(doc.status)',
    '__itemCommitted(__editItem.*)',
    '__subroutePath(routeData.*, subroute.path, subrouteData.id)'
  ],

  attached: function () {
    this.__tryLoadData();
  },
  __authStatus: function () {
    this.__tryLoadData();
  },

  __tryLoadData: function () {
    this.__silly(this.doc);
    if (this.get('doc.status') === 'done') {
      this.__loadMode = 'loaded';
    }

    // if (this.doc.status === 'uninitialised') {
    //   this.set('doc.status', 'initialise');
    // }
  },
  __docStatus: function () {
    if (this.get('doc.status') !== 'done') {
      return;
    }
    this.__loadMode = 'loaded';

    this.__silly(this.__pageMode);
    if (this.__pageMode === 'detail') {
      this.__assert(this.subrouteData.id);
      this.__selectedItemIndex = this.__indexFromId(this.get('subrouteData.id'));
      this.__selectedItem = this.__itemFromId(this.get('subrouteData.id'));
      if (this.__selectedItem) {
        let path = `doc.data.#${this.__selectedItemIndex}`;
        this.linkPaths('__selectedItem', path);
        this.__debug('__selectedItem Path Linked', path);
      }
    }
  },

  __navBack: function() {
    this.__debug('__navBack', this.__subPageMode);

    if(!this.pageFirstLoad && window.history.length > 0){
      return window.history.back();
    }

    if (this.__subPageMode && this.__subPageMode !== 'info') {
      this.set('subrouteAction.path', '');
      this.set('subrouteActionData.action', '');
      return;
    }

    this.set('subroute.path','/');
    this.set('subrouteData.id','');
  },

  __openTasks: function() {
    this.__debug('__openTasks');
  },

  __computeSubPageMode: function() {
    if (!this.subrouteAction.path) {
      return 'info';
    }
    let action = this.subrouteAction.path.split('/');
    this.__silly('__computeSubPageMode', action);
    return action.length > 1 ? action[1] : 'info';
  },
  __computeSubPageModeId: function() {
    if (!this.subrouteAction.path) {
      return 'info';
    }
    let action = this.subrouteAction.path.split('/');
    return action.length > 2 ? action[2] : '';
  },

  __viewItem: function(ev) {
    // this.__debug(ev.model.get('index'));
    // this.set('__selectedItem', ev.model.get('item'));
    let item = ev.model.get('item');
    // this.__debug(this.subroute);
    this.set('subroute.path',`/${item.id}`);
    // this.set('subrouteData.id', this.__selectedItem.id);
    // this.__debug(this.subroute);
  },
  __addItem: function () {
    this.__editItem = {};
    this.set('__mode', 'add');
    this.__fab.disabled = true;
  },
  __rmItem: function (ev) {
    if (!this.__selectedItem) {
      this.__selectedItem = ev.model.get('item');
    }
    this.__rmItemDialog.open();
    this.__fab.disabled = true;
  },
  __updateItem: function (ev) {
    this.__editItem = ev.model.get('item');
    this.__fab.disabled = true;
    this.__mode = 'update';
  },

  __rmItemConfirmed: function () {
    if (this.__selectedItem === null) {
      this.__warn("tried to delete without selecting");
      return;
    }
    this.splice('doc.data', this.__indexFromId(this.__selectedItem.id), 1);
    this.__navBack();
  },
  __dialogClosed: function () {
    this.__fab.disabled = false;
    this.__mode = '';
  },
  __itemCommitted: function () {
    if (this.__mode === '') {
      return;
    }
    let clone = Object.assign({}, this.__editItem);
    this.__silly(clone);
    if (this.__mode === 'add') {
      this.push('doc.data', clone);
    } else {
      this.set(['doc.data', this.__indexFromId(this.__selectedItem.id)], clone);
    }
  },

  __subroutePath: function() {
    this.__silly(`__subroutePath: Page: ${this.name}`);
    this.__silly(`__subroutePath: Route: ${this.get('routeData.page')}`);
    this.__silly(`__subroutePath: ActionRoute: ${this.get('subrouteAction.path')}`);
    // this.__debug(`__subroutePath: Route: ${this.get('routeData.page')===this.name}`);
    if (this.get('routeData.page') !== this.name) {
      return;
    }
    // this.__warn('__subroutePath');

    let path = this.get('subroute.path');
    let id = this.get('subrouteData.id');
    this.__debug(`__subroutePath: path(${path}), id(${id})`);

    if (!path || !id) {
      this.__pageMode = 'list';
      this.__selectedItem = null;
      this.__selectedItemIndex = -1;
      // this.unlinkPaths('__selectedItem');
      // this.__debug('__selectedItem Path Unlinked');
      return;
    }

    let item = this.__itemFromId(this.get('subrouteData.id'));
    let itemIndex = this.__indexFromId(this.get('subrouteData.id'));
    this.__selectedItemIndex = itemIndex;
    this.__selectedItem = item;
    if (this.__selectedItem) {
      let path = `doc.data.#${itemIndex}`;
      this.linkPaths('__selectedItem', path);
      this.__debug('__selectedItem Path Linked', path);
    }
    // this.__debug(this.get('__selectedItem.name'));
    this.__pageMode = 'detail';
  },

  __itemFromId: function(id) {
    this.__silly(`__itemFromId: ${id}`);
    if (this.__loadMode === 'loading') {
      this.__silly('__itemFromId:loading');
      return null;
    }
    return this.doc.data.find(i => i.id === id);
  },

  __indexFromId: function(id) {
    if (this.__loadMode === 'loading') {
      return -1;
    }
    return this.doc.data.findIndex(i => i.id === id);
  },
  __computeSubPageTitle: function() {
    return this.__selectedItem ? this.__selectedItem.name : ''
  },
  __computeDialogTitle: function(title, __mode) {
    if (!__mode) {
      return;
    }

    let titles = {
      'add': `Add ${this.title}`,
      'update': `Update ${this.title}`
    };
    this.__silly(`title: ${__mode}: ${titles[__mode]}`);
    return titles[__mode];
  },
  __computeDialogSubmitTitle: function(__mode) {
    if (!__mode) {
      return;
    }
    let titles = {
      'add': 'Add',
      'update': 'Update'
    };
    this.__silly(`submit: ${__mode}: ${titles[__mode]}`);
    return titles[__mode];
  },
  __computeDialogOpen: function(__mode) {
    this.__silly(`open: ${__mode}`);
    return __mode === 'add' || __mode === 'update';
  },
};
