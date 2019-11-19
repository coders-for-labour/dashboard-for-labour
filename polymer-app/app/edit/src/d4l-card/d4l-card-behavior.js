/**
 * @polymerBehavior Polymer.D4LCardBehavior
 */
Polymer.D4LCardBehavior = {
  properties: {
    __showButtons: {
      type: Boolean,
      value: false
    }
  },
  listeners: {
    'mouseenter': '__mouseEnter',
    'mouseleave': '__mouseLeave',
    'tap': 'tap'
  },

  __mouseEnter: function() {
    this.__showButtons = true;
  },
  __mouseLeave: function() {
    this.__showButtons = false;
  },
  tap: function() {
    // this.__showButtons = !this.__showButtons;
    this.fire('view-entity', `/${this.type}/${this.get('campaign').id}`);

  }

};
