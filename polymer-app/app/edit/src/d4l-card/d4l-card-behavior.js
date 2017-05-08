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
    'tap': '__tap'
  },

  __mouseEnter: function(ev) {
    this.__showButtons = true;
  },
  __mouseLeave: function(ev) {
    this.__showButtons = false;
  },
  __tap: function(ev) {
    this.__showButtons = !this.__showButtons;
  }

};
