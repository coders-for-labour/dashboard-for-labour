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

    routes: {
      type: Object
    },

    doc: {
      type: Object,
      notify: true
    },
    db: {
      type: Object,
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
    __mode: {
      type: String,
      value: ''
    }
  },
  observers: [
    '__authStatus(auth.user)',
    '__tryLoadData(auth.user, doc.status)',
    '__subroutePath(routes.*, __loadMode)'
  ],

  attached: function () {
    this.__tryLoadData();
  },
  __authStatus: function () {
    this.__tryLoadData();
  },

  __tryLoadData: function () {
    this.__silly('__tryLoadData', 'doc', this.doc);
    if (this.get('doc.status') === 'done') {
      this.set('__loadMode', 'loaded');
    }
  },


  __subroutePath: function() {
    if (this.get('__loadMode') !== 'loaded') return;

    const name = this.get('name');
    const routes = this.get('routes');
    this.__silly(`__subroutePath: Page: ${name}`);
    this.__silly(`__subroutePath: Route: ${this.get('routes.route')}`);
    this.__silly(`__subroutePath: ActionRoute: ${this.get('routes.subroute')}`);

    if (routes.route !== name) return;

    if (!routes.subroute) {
      this.set('__pageMode', 'list');
      this.set('__selectedItem', null);
      this.set('__selectedItemIndex', -1);
      this.__silly('List mode');
      return;
    }

    const selectedItem = this.get('__selectedItem');
    const item = this.__itemFromId(routes.subroute);
    const itemIndex = this.__indexFromId(routes.subroute);
    if (item) {
      if (selectedItem !== item) {
        this.unlinkPaths('__selectedItem');
      }

      this.set('__selectedItemIndex', itemIndex);
      this.set('__selectedItem', item);

      const docPath = `doc.data.${itemIndex}`;
      this.linkPaths('__selectedItem', docPath);
      this.set('__pageMode', 'detail');
    }
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
  }
};
