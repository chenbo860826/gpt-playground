var _createClassSeed = 0;

function createClass(cssBody, cssName) {
  let className = cssName || ('auto_' + _createClassSeed++);

  if (typeof (cssBody) == 'string') {
    document.styleSheets[0].addRule('.' + className, cssBody);
  }
  else {
    for (let i in cssBody) {
      document.styleSheets[0].addRule('.' + className + ((!i || (i.startsWith(':'))) ? i : ' ' + i), cssBody[i]);
    }
  }

  return className;
}

let handlers = {}

function bindClassHandler(className, eventType, handler, options) {
  // normalize className to accept cls as argument
  className = typeof (className) == 'function' ? className.name : className;

  // register the event handler
  let handlersOfEvent = handlers[eventType];
  if (!handlersOfEvent) {
    handlersOfEvent = {};
    handlers[eventType] = handlersOfEvent;
    document.addEventListener(eventType, globalClassHandler, options);
  }

  handlersOfEvent[className] = handler;
}

function globalClassHandler(event) {
  let handlersOfEvent = handlers[event.type];
  for (let srcElement = event.srcElement; srcElement != null; srcElement = srcElement.parentElement) {
    if (srcElement.className) {
      let handlerOfClass = handlersOfEvent[srcElement.className];
      if (handlerOfClass) {
        handlerOfClass($(srcElement), event.type, event);
      }
    }
  }
}

let jelemClasses = {}
let jelemEvents = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout']

function registerJelemClass(cls) {
  // create and register the jelemCls
  let clsName = cls.name;
  let jelemCls = new cls();
  jelemClasses[clsName] = jelemCls;

  // register css if necessary
  if (jelemCls.css) {
    createClass(jelemCls.css(), clsName);
  }

  // register global event handler for convenient purpose if necessary
  for (let e of jelemEvents) {
    if (jelemCls[e]) {
      bindClassHandler(clsName, e, (jelem, evtType, event) => globalJelemClassHandler(clsName, jelem, evtType, event));
    }
  }

  // return the cls for chain statement
  return cls;
}

function globalJelemClassHandler(clsName, jelem, evtType, event) {
  let jelemCls = jelemClasses[clsName]; // get registered class instance
  if (jelemCls[evtType]) {
    jelemCls[evtType](jelem, evtType, event);
  }
}

function createJelem(cls, data, extra, additional) {
  let clsName = cls.name;

  // get the registered cls
  let jelemCls = jelemClasses[clsName]; // get registered class instance
  if (!jelemCls) {
    registerJelemClass(cls);
    jelemCls = jelemClasses[clsName];
  }

  let jelem = jelemCls.create(data, extra, additional);
  jelem.attr('class', clsName); // set class of the jelem
  return jelem;
}

function isJelem(jelem, cls) {
  return jelem.hasClass(cls.name);
}

function getJelem(dom, cls) {
  let clsName = cls.name;
  for (let srcElement = $(dom); srcElement.length > 0 && srcElement != null; srcElement = srcElement.parent()) {
    if (srcElement.hasClass(clsName)) {
      return srcElement;
    }
  }
}

function overlapPrototype(instance, proto) {
  // overlap wrapCls methods
  let methods = Object.getOwnPropertyNames(proto);
  for (let i of methods) {
    if (i != 'constructor') {
      instance[i] = proto[i];
    }
  }

  // go further with proto
  proto = Object.getPrototypeOf(proto);
  if(proto != Object.prototype) {
    overlapPrototype(instance, proto);
  }
}

// injected functions for native jquery
$.fn.equals = function (compareTo) {
  if (!compareTo || this.length != compareTo.length) {
    return false;
  }
  for (var i = 0; i < this.length; ++i) {
    if (this[i] !== compareTo[i]) {
      return false;
    }
  }
  return true;
};

$.fn.wrap = function (cls) {
  // It is possible to specify cls and work as cast. It is helpful to call wrapped function in create() func (though could be dangerous)
  let clsName = (cls && cls.name) || this.attr('class');

  let jelemCls = jelemClasses[clsName]; // get registered class instance
  if (jelemCls.wrap) {
    let wrapCls = jelemCls.wrap();
    overlapPrototype(this, wrapCls.prototype);
  }

  return this;
};