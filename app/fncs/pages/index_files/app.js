(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   3.3.1
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  return function () {
    vertxNext(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

polyfill();
// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));
//# sourceMappingURL=es6-promise.map
}).call(this,require("r7L21G"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"r7L21G":5}],2:[function(require,module,exports){
/**
 * node-iterate79/ary.js
 */
(function(module){
	var Promise = require('es6-promise').Promise;

	/**
	 * 配列の直列処理
	 */
	module.exports = function( ary, fnc, fncComplete ){
		var bundle = 1;
		if( arguments.length >= 4 ){
			ary = arguments[0];
			bundle = arguments[1];
			fnc = arguments[arguments.length-2];
			fncComplete = arguments[arguments.length-1];
		}
		bundle = bundle || 1;

		return new (function( ary, bundle, fnc, fncComplete ){
			var _this = this;
			this.idx = -1;
			this.idxs = []; // <- array keys
			for( var i in ary ){
				this.idxs.push(i);
			}
			this.bundle = bundle||1;
			this.bundleProgress = 1;
			this.ary = ary||[];
			this.fnc = fnc||function(){};
			this.completed = false;
			this.fncComplete = fncComplete||function(){};

			this.next = function(){
				var _this = this;
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					_this.bundleProgress --;
					if( _this.bundleProgress > 0 ){
						// bundleごとの処理が終わっていない
						return;
					}
					if( _this.idx+1 >= _this.idxs.length && _this.bundleProgress<=0 ){
						_this.destroy();
						return;
					}
					var tmp_idx = _this.idx;
					_this.idx = _this.idx+_this.bundle;
					for(var i = 0; i<_this.bundle; i++){
						tmp_idx ++;
						if( tmp_idx >= _this.idxs.length ){
							// 端数があった場合、bundleの数に欠員が出る可能性がある。
							break;
						}
						_this.bundleProgress ++;
						_this.fnc( _this, _this.ary[_this.idxs[tmp_idx]], _this.idxs[tmp_idx] );
					}
					return;
				}); });
				return this;
			}
			this.break = function(){
				var _this = this;
				_this.destroy();
				return;
			}
			this.destroy = function(){
				var _this = this;
				_this.idx = _this.idxs.length - 1;
				_this.bundleProgress = 0;
				if(_this.completed){return;}
				_this.completed = true;
				_this.fncComplete();
				return;
			}
			this.next();
			return;
		})(ary, bundle, fnc, fncComplete);
	}

})(module);

},{"es6-promise":1}],3:[function(require,module,exports){
/**
 * node-iterate79/fnc.js
 */
(function(module){
	var Promise = require('es6-promise').Promise;

	/**
	 * 関数の直列処理
	 */
	module.exports = function(aryFuncs){
		var mode = 'explicit';
		var defaultArg = undefined;
		if( arguments.length >= 2 ){
			mode = 'implicit';
			defaultArg = arguments[0];
			aryFuncs = arguments[arguments.length-1];
		}


		function iterator( aryFuncs ){
			aryFuncs = aryFuncs||[];
			var _this = this;

			_this.idx = 0;
			_this.idxs = []; // <- array keys
			for( var i in aryFuncs ){
				_this.idxs.push(i);
			}
			_this.idxsidxs = {}; // <- array keys keys
			for( var i in _this.idxs ){
				_this.idxsidxs[_this.idxs[i]] = i;
			}
			_this.funcs = aryFuncs;
			var isStarted = false;//2重起動防止

			this.start = function(arg){
				var _this = this;
				if(isStarted){return;}
				isStarted = true;
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					_this.next(arg);
				}); });
				return;
			}
			this.next = function(arg){
				var _this = this;
				arg = arg||{};
				if(_this.idxs.length <= _this.idx){return;}
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					(_this.funcs[_this.idxs[_this.idx++]])(_this, arg);
				}); });
				return;
			};
			this.goto = function(key, arg){
				var _this = this;
				_this.idx = _this.idxsidxs[key];
				arg = arg||{};
				if(_this.idxs.length <= _this.idx){return;}
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					(_this.funcs[_this.idxs[_this.idx++]])(_this, arg);
				}); });
				return;
			};
			this.break = function(){
				this.destroy();
				return;
			}
			this.destroy = function(){
				return;
			}
			return;
		}
		var rtn = new iterator(aryFuncs);
		if( mode == 'implicit' ){
			rtn.start(defaultArg);
			return rtn;
		}
		return rtn;
	}


})(module);

},{"es6-promise":1}],4:[function(require,module,exports){
/**
 * node-iterate79
 */
(function(module){

	/**
	 * 配列の直列処理
	 */
	module.exports.ary = require('./ary.js');

	/**
	 * 関数の直列処理
	 */
	module.exports.fnc = require('./fnc.js');


})(module);

},{"./ary.js":2,"./fnc.js":3}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(require,module,exports){
window.px = window.parent.px;
window.contApp = new (function( px ){
	if( !px ){ alert('px が宣言されていません。'); }
	var it79 = require('iterate79');

	var _this = this;
	var app = this;
	var $elms = {};

	var _param = px.utils.parseUriParam( window.location.href );
	var _pj = this.pj = px.getCurrentProject();
	var _currentPagePath;
	var _currentPageInfo;

	var contentsComment,
		pageDraw,
		pageSearch;

	this.git = _pj.git();
	this.gitUi = new px2dtGitUi(px, _pj);

	/**
	 * 初期化
	 */
	function init(callback){
		callback = callback || function(){};
		it79.fnc({},[
			function(it1, arg){
				_this.pj.checkPxCmdVersion(
					{
						apiVersion: '>=2.0.30',
						px2dthelperVersion: '>=2.0.4'
					},
					function(){
						// API設定OK
						it1.next(arg);
					},
					function( errors ){
						// API設定が不十分な場合のエラー処理
						var html = px.utils.bindEjs(
							document.getElementById('template-not-enough-api-version').innerHTML,
							{errors: errors}
						);
						$('.contents').html( html );
						// エラーだったらここで離脱。
						callback();
						return;
					}
				);
			},
			function(it1, arg){
				$elms.editor = $('<div>');
				$elms.sitemapParent = $('.cont_sitemap_parent');
				$elms.brosList = $('.cont_sitemap_broslist');
				$elms.searchList = $('.cont_sitemap_search');
				$elms.preview = $('.cont_preview');
				$elms.previewIframe = $elms.preview.find('iframe');
				$elms.pageinfo = $('.cont_page_info');
				$elms.commentView = $('.cont_comment_view');
				$elms.workspaceSearch = $('.cont_workspace_search');
				$elms.breadcrumb = $('.cont_breadcrumb');

				// bootstrap
				$('*').tooltip();

				it1.next(arg);
			},
			function(it1, arg){
				$elms.preview
					.css({
						'height': 600
					})
				;
				$elms.previewIframe
					.on('load', function(){
						// console.log('=-=-=-=-=-=-=-= iframe loaded.');
						var currentPagePath;

						it79.fnc({}, [
							function(it, prop){
								px.cancelDrop( $elms.previewIframe.get(0).contentWindow );

								currentPagePath = app.extractPagePathFromPreviewLocation();

								it.next(prop);
							} ,
							function(it, prop){
								// console.log(prop);
								app.goto( currentPagePath, {}, function(){
									it.next(prop);
								} );
							} ,
							function(it, prop){
								callback();
							}
						]);

					})
				;
				it1.next(arg);
			},
			function(it1, arg){
				contentsComment = new (require('./libs.ignore/contentsComment.js'))(_this, px, _pj);
				pageDraw = new (require('./libs.ignore/pageDraw.js'))(_this, px, _pj, $elms, contentsComment);
				pageSearch = new (require('./libs.ignore/pageSearch.js'))(_this, px, _pj, $elms);
				it1.next(arg);
			},
			function(it1, arg){
				// フィルター機能を初期化
				pageSearch.init( function(){
					it1.next(arg);
				} );
			},
			function(it1, arg){
				// ページ情報を初期化
				pageDraw.init( function(){
					it1.next(arg);
				} );
			},
			function(it1, arg){
				// 最初のページ情報を描画
				var startPage = _param.page_path;
				// var startPage = '/hoge/fuga/notfound.html';
				app.goto( startPage, {'force':true}, function(){
					it1.next(arg);
				} );
			},
			function(it1, arg){
				$(window).resize();
				it1.next(arg);
			},
			function(it1, arg){
				callback();
			}
		]);

	} // init()

	/**
	 * 素材フォルダを開く
	 */
	this.openMaterialsDirectory = function( path ){
		var pathFiles = _pj.getContentFilesByPageContent( _pj.findPageContent( path ) );
		var realpathFiles = _pj.get_realpath_controot()+pathFiles;
		if( !px.utils.isDirectory( realpathFiles ) ){
			px.fs.mkdirSync( realpathFiles );
			if( !px.utils.isDirectory( realpathFiles ) ){
				return false;
			}
		}
		var realpath_matDir = realpathFiles + 'materials.ignore/';
		if( !px.utils.isDirectory( realpath_matDir ) ){
			px.fs.mkdirSync( realpath_matDir );
			if( !px.utils.isDirectory( realpath_matDir ) ){
				return false;
			}
		}
		px.utils.openURL( realpath_matDir );
		return this;
	}

	/**
	 * リソースフォルダを開く
	 */
	this.openResourcesDirectory = function( path ){
		var pathFiles = _pj.getContentFilesByPageContent( _pj.findPageContent( path ) );
		var realpathFiles = _pj.get_realpath_controot()+pathFiles;
		if( !px.utils.isDirectory( realpathFiles ) ){
			px.fs.mkdirSync( realpathFiles );
			if( !px.utils.isDirectory( realpathFiles ) ){
				return false;
			}
		}
		px.utils.openURL( realpathFiles );
		return this;
	}

	/**
	 * コンテンツをコミットする
	 */
	this.commitContents = function( page_path ){
		this.gitUi.commit('contents', {'page_path': page_path}, function(result){
			console.log('(コミット完了しました)');
		});
		return this;
	}


	/**
	 * コンテンツのコミットログを表示する
	 */
	this.logContents = function( page_path ){
		this.gitUi.log('contents', {'page_path': page_path}, function(result){
			console.log('(コミットログを表示しました)');
		});
		return this;
	}

	/**
	 * プレビューのURL から ページパスを抽出する
	 */
	this.extractPagePathFromPreviewLocation = function(previewLocation){
		if( !previewLocation ){
			previewLocation = $elms.previewIframe.get(0).contentWindow.location;
		}
		switch( previewLocation.href ){
			case 'blank':
			case 'about:blank':
				return;
		}
		var to = previewLocation.pathname;
		var pathControot = _pj.getConfig().path_controot;
		to = to.replace( new RegExp( '^'+px.utils.escapeRegExp( pathControot ) ), '' );
		to = to.replace( new RegExp( '^\\/*' ), '/' );

		var page_path = to;
		return page_path;
	}

	/**
	 * カレントページの情報を取得する
	 */
	this.getCurrentPageInfo = function(){
		return _currentPageInfo;
	}

	/**
	 * カレントページのパスを取得する
	 */
	this.getCurrentPagePath = function(){
		return _currentPagePath;
	}

	/**
	 * 指定ページへ移動する
	 */
	this.goto = function( page_path, options, callback ){
		callback = callback || function(){};
		options = options || {};
		if(page_path === undefined){
			page_path = '';
		}
		// console.log(_currentPagePath, page_path);
		if( _currentPagePath === page_path && !options.force ){
			// 遷移先がカレントページを同じければ処理しない。
			callback();
			return;
		}

		// 直接表示できないパスを解決してリダイレクトする
		function redirectPage(page_path, options, callback){
			_pj.px2proj.href(page_path, function(href){
				// console.log(href);
				var path_controot = '/';
				try {
					path_controot = _currentPageInfo.config.path_controot;
				} catch (e) {
				}
				href = href.replace(new RegExp('^'+px.utils.escapeRegExp(_currentPageInfo.config.path_controot)), '/');
				// console.log(href);
				px.progress.close();
				app.goto(href, options, callback);
			});
			return;
		}

		if( page_path.match(new RegExp('^alias[0-9]*\\:')) ){
			px.message( 'このページはエイリアスです。' );
			redirectPage(page_path, options, callback);
			return;
		}

		px.progress.start({"showProgressBar":false, 'blindness':false});

		_currentPagePath = page_path;

		_pj.px2dthelperGetAll(page_path, {'filter': false}, function(pjInfo){
			// console.log(pjInfo);
			_currentPageInfo = pjInfo;

			if(_currentPageInfo.page_info === false){
				// var pageInfo = _pj.site.getPageInfo( page_path );
				// console.log(pageInfo);
				redirectPage(page_path, options, callback);
				return;
			}

			// 描画・プレビューロードをキック
			pageDraw.redraw( _currentPageInfo, options, function(){
				app.loadPreview( _currentPagePath, options, function(){
					px.progress.close();
					callback();
				} );
			} );
		});


		return;
	}

	/**
	 * プレビューウィンドウにページを表示する
	 */
	this.loadPreview = function( page_path, options, callback ){
		callback = callback || function(){};
		if(!options){ options = {}; }
		if(!options.force){ options.force = false; }

		if( !page_path ){
			page_path = _pj.getConfig().path_top;
		}

		var currentPreviewPagePath = this.extractPagePathFromPreviewLocation();
		var gotoUrl = px.preview.getUrl(page_path);
		var currentPreviewPageUrl = px.preview.getUrl(currentPreviewPagePath);
		// console.log(currentPreviewPageUrl, gotoUrl);

		if( currentPreviewPageUrl == gotoUrl && !options.force ){
			// 現在表示中の `page_path` と同じなら、リロードをスキップ
			callback();
			return;
		}
		// $elms.pageinfo.html('<div style="text-align:center;">now loading ...</div>');

		px.preview.serverStandby( function(){
			$elms.previewIframe.attr( 'src', gotoUrl );
			callback();
		} );
		return;
	} // goto()

	/**
	 * エディター画面を開く
	 */
	this.openEditor = function( pagePath ){
		var pageInfo = _pj.site.getPageInfo( pagePath );
		if( !pageInfo ){
			alert('ERROR: Undefined page path. - ' + pagePath);
			return this;
		}

		this.closeEditor();//一旦閉じる

		// プログレスモード表示
		px.progress.start({
			'blindness':true,
			'showProgressBar': true
		});

		var contPath = _pj.findPageContent( pagePath );
		var contRealpath = _pj.get('path')+'/'+contPath;
		var pathInfo = px.utils.parsePath(contPath);
		var pagePath = pageInfo.path;
		if( _pj.site.getPathType( pageInfo.path ) == 'dynamic' ){
			var dynamicPathInfo = _pj.site.get_dynamic_path_info(pageInfo.path);
			pagePath = dynamicPathInfo.path;
		}

		if( px.fs.existsSync( contRealpath ) ){
			contRealpath = px.fs.realpathSync( contRealpath );
		}

		$elms.editor = $('<div>')
			.css({
				'position':'fixed',
				'top':0,
				'left':0 ,
				'z-index': '1000',
				'width':'100%',
				'height':$(window).height()
			})
			.append(
				$('<iframe>')
					//↓エディタ自体は別のHTMLで実装
					.attr( 'src', '../../mods/editor/index.html'
						+'?page_path='+encodeURIComponent( pagePath )
					)
					.css({
						'border':'0px none',
						'width':'100%',
						'height':'100%'
					})
			)
			.append(
				$('<a>')
					.html('&times;')
					.attr('href', 'javascript:;')
					.click( function(){
						// if(!confirm('編集中の内容は破棄されます。エディタを閉じますか？')){ return false; }
						_this.closeEditor();
					} )
					.css({
						'position':'absolute',
						'bottom':5,
						'right':5,
						'font-size':'18px',
						'color':'#333',
						'background-color':'#eee',
						'border-radius':'0.5em',
						'border':'1px solid #333',
						'text-align':'center',
						'opacity':0.4,
						'width':'1.5em',
						'height':'1.5em',
						'text-decoration': 'none'
					})
					.hover(function(){
						$(this).animate({
							'opacity':1
						});
					}, function(){
						$(this).animate({
							'opacity':0.4
						});
					})
			)
		;
		$('body')
			.append($elms.editor)
			.css({'overflow':'hidden'})
		;

		return this;
	} // openEditor()

	/**
	 * エディター画面を閉じる
	 * 単に閉じるだけです。編集内容の保存などの処理は、editor.html 側に委ねます。
	 */
	this.closeEditor = function(){
		$elms.editor.remove();
		$('body')
			.css({'overflow':'auto'})
		;
		_this.loadPreview( _currentPagePath, {'force':true}, function(){} );
		return this;
	} // closeEditor()

	/**
	 * ウィンドウリサイズイベントハンドラ
	 */
	function onWindowResize(){
		$elms.editor
			.css({
				'height': $(window).innerHeight() - 0
			})
		;

		var heightBreadcrumb = $elms.breadcrumb.outerHeight();

		var $workspaceContainer = $('.cont_workspace_container');
		$workspaceContainer
			.css({
				'height': $(window).innerHeight() - $('.container').outerHeight() - $elms.commentView.outerHeight() - $elms.workspaceSearch.outerHeight() - heightBreadcrumb - 20,
				'margin-top': 10
			})
		;
		$elms.brosList
			.css({
				'height': $workspaceContainer.innerHeight() - $elms.sitemapParent.outerHeight()
			})
		;
		$elms.preview
			.css({
				'height': $('.cont_workspace_container').parent().outerHeight() - $elms.pageinfo.outerHeight() - heightBreadcrumb
			})
		;

	}

	// 初期化処理開始
	$(function(){
		init();
		$(window).on('resize', function(){
			onWindowResize();
		});

	});

})( window.parent.px );

},{"./libs.ignore/contentsComment.js":7,"./libs.ignore/pageDraw.js":8,"./libs.ignore/pageSearch.js":9,"iterate79":4}],7:[function(require,module,exports){
/**
 * contentsComment.js
 */
module.exports = function(app, px, pj){
	var _this = this;
	var realpath_comment_file;
	var pageInfo;
	var $commentView;

	/**
	 * 初期化
	 */
	this.init = function( _pageInfo, _$commentView ){
		pageInfo = _pageInfo;
		$commentView = _$commentView;

		var pathFiles = pj.getContentFilesByPageContent(
			pj.findPageContent( pageInfo.path )
		);
		var realpathFiles = pj.get_realpath_controot()+pathFiles;
		var realpath_matDir = realpathFiles + 'comments.ignore/';
		realpath_comment_file = realpath_matDir + 'comment.md';

		$commentView
			.html('...')
			.attr({'data-path': pageInfo.path})
			.off('dblclick')
			.on('dblclick', function(){
				_this.editComment();
				return false;
			})
		;


		setTimeout(function(){
			_this.updateComment();
		}, 10);

		return;
	}

	/**
	 * コメントを編集する
	 * @return {[type]} [description]
	 */
	this.editComment = function(){
		var $body = $('<div>');
		var $textarea = $('<textarea class="form-control">');
		var $preview = $('<div>');
		$body
			.append( $('<div>')
				.css({
					'display': 'flex',
					'height': '450px',
					'margin': '1em 0'
				})
				.append($textarea.css({
					'width': '50%',
					'height': '100%',
					'overflow': 'auto'
				}))
				.append($preview.css({
					'width': '50%',
					'height': '100%',
					'overflow': 'auto',
					'padding': '20px'
				}))
			)
		;

		function update(){
			var src = $textarea.val();
			var html = px.utils.markdown( src );
			var $html = $('<div>').html(html);
			$html.find('a[href]').on('click', function(){
				px.utils.openURL(this.href);
				return false;
			});
			$preview.html($html);
		}
		$textarea.on('change keyup', function(){
			update();
		});

		px.fs.readFile(realpath_comment_file, {'encoding':'utf8'}, function(err, data){
			$textarea.val(data);
			update();

			px.dialog({
				'title': 'コンテンツコメントを編集',
				'body': $body,
				'buttons':[
					$('<button>')
						.text('OK')
						.addClass('px2-btn--primary')
						.on('click', function(){
							var val = $body.find('textarea').val();
							px.fs.writeFileSync( realpath_comment_file, val );

							_this.updateComment(function(){
								px.closeDialog();
							});
						}),
					$('<button>')
						.text('Cancel')
						.on('click', function(){
							px.closeDialog();
						})
				]
			});

		});
		return;
	}

	/**
	 * コメント表示欄を更新する
	 * @return {[type]} [description]
	 */
	this.updateComment = function(callback){
		callback = callback || function(){};
		if(!px.utils.isFile( realpath_comment_file )){
			$commentView.text('no comment.');

			callback(true);
			return;
		}
		$commentView.text('コメントをロードしています...');
		px.fs.readFile(realpath_comment_file, {'encoding':'utf8'}, function(err, data){
			var html = px.utils.markdown( data );
			var $html = $('<div>').html(html);
			$html.find('a[href]').on('click', function(){
				px.utils.openURL(this.href);
				return false;
			});
			$commentView.html($html);

			callback(true);
		});
		return;
	}

	return;
}

},{}],8:[function(require,module,exports){
/**
 * pageDraw.js
 */
module.exports = function(app, px, pj, $elms, contentsComment){
	var it79 = require('iterate79');
	var _this = this;

	/**
	 * 初期化する
	 */
	this.init = function(callback){
		callback = callback || function(){};
		// 特に何もするべきことはない。
		callback();
		return;
	}

	/**
	 * ページを再描画する
	 */
	this.redraw = function(pj_info, options, callback){
		callback = callback || function(){};
		var contProcType;
		var page_path = null;
		try {
			page_path = pj_info.page_info.path;
		} catch (e) {
		}

		// console.log(pj_info);

		it79.fnc({}, [
			function(it, prop){
				px.cancelDrop( $elms.previewIframe.get(0).contentWindow );

				prop.pageInfo = pj_info.page_info;
				prop.navigationInfo = pj_info.navigation_info;

				if( pj_info.page_info === null ){
					// サイトマップに定義のないページにアクセスしようとした場合
					// ページがない旨を表示して終了する。
					$elms.pageinfo.html( '<p>ページが未定義です。</p>' );
					callback();
					return;
				}else if( typeof(pj_info.page_info) != typeof({}) ){
					// 何らかのエラーでページ情報が取得できていない場合
					// エラーメッセージを表示して終了する。
					$elms.pageinfo.html( '<p>ページ情報の取得に失敗しました。</p>' );
					callback();
					return;
				}

				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// パンくずを表示
				var tpl = $('#template-breadcrumb').html();
				var html = px.utils.bindEjs(tpl, {'navigationInfo': pj_info.navigation_info});
				$elms.breadcrumb.html(html);
				$elms.breadcrumb.find('a').on('click', function(e){
					var page_path = $(this).attr('data-page-path');
					app.goto(page_path);
					return false;
				});
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// parentページを表示
				$elms.sitemapParent.html('');
				if( pj_info.navigation_info.parent_info !== false ){
					$elms.sitemapParent
						.append($('<ul class="listview">')
							.append($('<li>')
								.append($('<a>')
									.append( '<span class="glyphicon glyphicon-level-up"></span>' )
									.append( $('<span>').text(pj_info.navigation_info.parent_info.title) )
									.attr({
										'href': 'javascript:;',
										'data-page-path': pj_info.navigation_info.parent_info.path
									})
									.on('click', function(e){
										var page_path = $(this).attr('data-page-path');
										app.goto(page_path);
										return false;
									})
								)
							)
						)
					;
				}
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// 兄弟と子供ページを表示
				$elms.brosList.html('');
				var tpl = $('#template-bros-list').html();
				var html = px.utils.bindEjs(tpl, {'navigationInfo': pj_info.navigation_info});
				$elms.brosList.html(html);
				$elms.brosList.find('a').on('click', function(e){
					var page_path = $(this).attr('data-page-path');
					app.goto(page_path);
					return false;
				});
				it.next(prop);
			} ,
			function(it, prop){
				// --------------------
				// エディターモードを取得
				pj.getPageContentEditorMode( prop.pageInfo.path, function(editorMode){
					contProcType = editorMode;
					it.next(prop);
				} );
			} ,
			function(it, prop){

				// --------------------
				// ボタンアクションを設定
				var $bs3btn = $($('#template-bootstrap3-btn-dropdown-toggle').html());
				var $html = $('<div>')
					.append( $('<div class="cont_page_info-prop">')
						.append( $('<span class="selectable">')
							.text( prop.pageInfo.title+' ('+prop.pageInfo.path+')' )
						)
						.append( $('<span>')
							// .text( contProcType )
							.addClass( 'px2-editor-type__' + (function(contProcType){
								switch(contProcType){
									case 'html.gui': return 'html-gui'; break;
									case '.not_exists': return 'not-exists'; break;
									case '.page_not_exists': return 'page-not-exists'; break;
									default:
										break;
								}
								return contProcType;
							})(contProcType) )
						)
					)
					.append( $('<div class="cont_page_info-btn">')
						.append( $bs3btn )
					)
				;

				// サイトマップに編集者コメント欄があったら表示する
				// 　※サイトマップ拡張項目 "editor-comment" から自動的に取得する。
				// 　　Markdown 処理して表示する。
				if( prop.pageInfo['editor-comment'] ){
					$html
						.append( $('<div class="cont_page_info-editor_comment">')
							.html( px.utils.markdown(prop.pageInfo['editor-comment']) )
						)
					;
				}

				// --------------------------------------
				// コンテンツコメント機能
				contentsComment.init( prop.pageInfo, $elms.commentView );


				// --------------------------------------
				// メインの編集ボタンにアクションを付加
				$bs3btn.find('button.btn--edit').eq(0)
					.attr({'data-path': prop.pageInfo.path})
					// .text('編集する')
					.css({
						'padding-left': '5em',
						'padding-right': '5em'
					})
					.on('click', function(){
						app.openEditor( $(this).attr('data-path') );
						return false;
					})
				;
				$bs3btn.find('button.btn--resources').eq(0)
					.attr({'data-path': prop.pageInfo.path})
					// .text('リソース')
					.on('click', function(){
						app.openResourcesDirectory( $(this).attr('data-path') );
						return false;
					})
				;

				var $dropdownMenu = $bs3btn.find('ul.cont_page-dropdown-menu');

				// --------------------------------------
				// ドロップダウンのサブメニューを追加
				if( contProcType != '.not_exists' ){
					$dropdownMenu
						.append( $('<li>')
							.append( $('<a>')
								.text( 'フォルダを開く' )
								.attr({
									'data-content': prop.pageInfo.content ,
									'href':'javascript:;'
								})
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									px.utils.openURL( px.utils.dirname( pj.get_realpath_controot()+$(this).attr('data-content') ) );
									return false;
								})
							)
						)
					;
				}
				if( contProcType != 'html.gui' ){
					$dropdownMenu
						.append( $('<li>')
							.append( $('<a>')
								.text( '外部テキストエディタで編集' )
								.attr({
									'data-path': prop.pageInfo.path ,
									'href':'javascript:;'
								})
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									var pathCont = pj.findPageContent( $(this).attr('data-path') );
									px.openInTextEditor( pj.get_realpath_controot()+pathCont );
									return false;
								})
							)
						)
					;
				}

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'ブラウザでプレビュー' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var $this = $(this);
								px.preview.serverStandby(function(){
									px.utils.openURL( px.preview.getUrl( $this.attr('data-path') ) );
								});
								return false;
							})
						)
					)
					.append( $('<li>')
						.append( $('<a>')
							.text( 'コンテンツのソースコードを表示' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var pathCont = pj.findPageContent( $(this).attr('data-path') );
								var src = px.fs.readFileSync( pj.get_realpath_controot()+pathCont );
								px.dialog({
									title: 'コンテンツのソースコードを表示',
									body: $('<div>')
										.append( $('<p>').text('ソースの閲覧・確認ができます。ここで編集はできません。'))
										.append( $('<p>').text('GUI編集されたコンテンツの場合は、編集後にビルドされたソースが表示されています。'))
										.append( $('<textarea class="form-control">')
											.val(src)
											.attr({'readonly':true})
											.css({
												'width':'100%',
												'height':300,
												'font-size': 14,
												'font-family': 'monospace'
											})
										)
								});
								return false;
							})
						)
					)
					.append( $('<li>')
						.append( $('<a>')
							.text( 'ページ情報を表示' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'data-page-info': JSON.stringify(prop.pageInfo),
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();

								var pagePath = $(this).attr('data-path');
								var pageInfo = $(this).attr('data-page-info');
								try {
									pageInfo = JSON.parse(pageInfo);
								} catch (e) {
								}

								var $tbl = $('<table class="def">')
									.css({'width': '100%'})
								;
								for(var idx in pageInfo){
									var $row = $('<tr>');
									$row.append( $('<th>').text(idx) );
									$row.append( $('<td class="selectable">').text(pageInfo[idx]) );
									// $row.append( $('<td>').text(typeof(pageInfo[idx])) );
									$tbl.append($row);
								}

								px.dialog({
									title: 'ページ情報を表示',
									body: $('<div>')
										.append( $('<p>').text('ページ「'+pagePath+'」の情報を確認できます。'))
										.append( $('<div>')
											.css({'margin': '1em 0'})
											.append($tbl)
										)
								});
								return false;
							})
						)
					)
				;
				$dropdownMenu
					.append( $('<li class="divider">') )
					.append( $('<li>')
						.append( $('<a>')
							.text( '埋め込みコメントを表示する' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var $this = $(this);
								var bookmarklet = "javascript:(function(){var b=document.body;elm=document.createElement('script');elm.setAttribute('type','text/javascript');elm.src='http://tomk79.github.io/DEC/dec_show.js';b.appendChild(elm);b.removeChild(elm);return;})();";
								$elms.previewIframe.get(0).contentWindow.location = bookmarklet;
								return false;
							})
						)
					)
				;
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( '素材フォルダを開く (--)' )
							.addClass('menu-materials')
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								app.openMaterialsDirectory( $(this).attr('data-path') );
								return false;
							})
						)
					)
				;

				setTimeout(function(){
					var button = $bs3btn.find('a.menu-materials').eq(0);
					var pathFiles = pj.getContentFilesByPageContent( pj.findPageContent( prop.pageInfo.path ) );
					var realpathFiles = pj.get_realpath_controot()+pathFiles;
					var realpath_matDir = realpathFiles + 'materials.ignore/';
					var matCount = 0;
					button.text('素材フォルダを開く ('+matCount+')');
					if( !px.utils.isDirectory(realpath_matDir) ){
						return;
					}

					var countFile_r = function(path){
						var list = px.utils.ls( path );
						for( var idx in list ){
							if( list[idx] == '.DS_Store' || list[idx] == 'Thumbs.db' ){
								continue;
							}
							if( px.utils.isFile(path+'/'+list[idx]) ){
								matCount ++;
								button.text('素材フォルダを開く ('+matCount+')');
							}else if( px.utils.isDirectory(path+'/'+list[idx]) ){
								countFile_r( path+'/'+list[idx] );
							}
						}
					}
					countFile_r(realpath_matDir);

				}, 10);

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'コンテンツコメントを編集' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								contentsComment.editComment();
								return false;
							})
						)
					)
				;

				$dropdownMenu
					.append( $('<li class="divider">') )
					.append( $('<li>')
						.append( $('<a>')
							.text( '他のページから複製して取り込む' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'data-proc_type': contProcType ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								if( !confirm('現状のコンテンツを破棄し、他のページを複製して取り込みます。よろしいですか？') ){
									return false;
								}
								var $this = $(this);
								var $body = $('<div>')
									.append( $('#template-copy-from-other-page').html() )
								;
								var $input = $body.find('input');
								var $list = $body.find('.cont_sample_list')
									.css({
										'overflow': 'auto',
										'height': 200,
										'background-color': '#f9f9f9',
										'border': '1px solid #bbb',
										'padding': 10,
										'margin': '10px auto',
										'border-radius': 5
									})
								;
								$input.on('change', function(){
									var val = $input.val();
									$list.html('<div class="px2-loading"></div>');
									pj.px2proj.query('/?PX=px2dthelper.search_sitemap&keyword='+encodeURIComponent(val), {
										"output": "json",
										"success": function(data){
											// console.log(data);
										},
										"complete": function(data, code){
											// console.log(data, code);
											var page_list = JSON.parse(data);
											// console.log(page_list);

											var $ul = $('<ul>')
											for(var i in page_list){
												var $li = $('<li>')
												$li.append( $('<a>')
													.text(page_list[i].path)
													.attr({
														'href': 'javascript:;',
														'data-path': page_list[i].path
													})
													.on('click', function(e){
														var path = $(this).attr('data-path');
														$input.val(path);
													})
												);
												$ul.append($li);
											}
											$list.html('').append($ul);
										}
									});
								});

								px.dialog({
									'title': '他のページから複製',
									'body': $body,
									'buttons':[
										$('<button>')
											.text('OK')
											.addClass('px2-btn--primary')
											.on('click', function(){
												var val = $input.val();
												var pageinfo = pj.site.getPageInfo(val);
												if( !pageinfo ){
													alert('存在しないページです。');
													return false;
												}
												pj.copyContentsData(
													pageinfo.path,
													$this.attr('data-path'),
													function(result){
														if( !result[0] ){
															alert('コンテンツの複製に失敗しました。'+result[1]);
															return;
														}
														app.loadPreview( app.getCurrentPagePath(), {"force":true}, function(){
															px.closeDialog();
														} );
													}
												);
											}),
										$('<button>')
											.text('Cancel')
											.on('click', function(){
												px.closeDialog();
											})
									]
								});
								return false;
							})
						)
					)
				;
				if( contProcType == 'html.gui' ){
					$dropdownMenu
						.append( $('<li>')
							.append( $('<a>')
								.text( 'GUI編集コンテンツを再構成する' )
								.attr({
									'title':'モジュールの変更を反映させます。',
									'data-path': prop.pageInfo.path ,
									'href':'javascript:;'
								})
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									var pagePath = $(this).attr('data-path');
									pj.buildGuiEditContent( pagePath, function(result){
										app.loadPreview( pagePath, {'force':true}, function(){} );
									} );
									return false;
								})
							)
						)
					;
				}

				if( contProcType != '.not_exists' ){
					$dropdownMenu
						.append( $('<li>')
							.append( $('<a>')
								.text( '編集方法を変更' )
								.attr({
									'data-path': prop.pageInfo.path ,
									'data-proc_type': contProcType ,
									'href':'javascript:;'
								})
								.on('click', function(){
									$bs3btn.find('.dropdown-toggle').click();
									var $this = $(this);
									var $body = $('<div>')
										.append( $('#template-change-proctype').html() )
									;
									$body.find('input[name=proc_type]').val( [$this.attr('data-proc_type')] );
									px.dialog({
										'title': '編集方法を変更する',
										'body': $body,
										'buttons':[
											$('<button class="px2-btn px2-btn--primary">')
												.text('OK')
												.on('click', function(){
													var val = $body.find('input[name=proc_type]:checked').val();
													pj.changeContentEditorMode( $this.attr('data-path'), val, function(result){
														if( !result[0] ){
															alert('編集モードの変更に失敗しました。'+result[1]);
															return;
														}
														app.loadPreview( app.getCurrentPagePath(), {"force":true}, function(){
															px.closeDialog();
														} );
													} )
												}),
											$('<button class="px2-btn">')
												.text('キャンセル')
												.on('click', function(){
													px.closeDialog();
												})
										]
									});
									return false;
								})
							)
						)
					;
				}
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'コンテンツをコミット' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								app.commitContents( $(this).attr('data-path') );
								$bs3btn.find('.dropdown-toggle').click();
								return false;
							})
						)
					)
				;

				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'コンテンツのコミットログ' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								app.logContents( $(this).attr('data-path') );
								$bs3btn.find('.dropdown-toggle').click();
								return false;
							})
						)
					)
				;
				$dropdownMenu
					.append( $('<li>')
						.append( $('<a>')
							.text( 'ページをリロード' )
							.attr({
								'data-path': prop.pageInfo.path ,
								'href':'javascript:;'
							})
							.on('click', function(){
								$bs3btn.find('.dropdown-toggle').click();
								var pagePath = $(this).attr('data-path');
								app.loadPreview( pagePath, {'force':true}, function(){} );
								return false;
							})
						)
					)
				;

				$elms.pageinfo.html( $html );

				$bs3btn.find('li').css(
					{
						"max-width": $bs3btn.width(),
						"overflow": "hidden"
					}
				);

				// ページ一覧の表示更新
				$elms.brosList.find('a').removeClass('current');
				$elms.brosList.find('a[data-id="'+prop.pageInfo.id+'"]').addClass('current');
				$elms.searchList.find('a').removeClass('current');
				$elms.searchList.find('a[data-id="'+prop.pageInfo.id+'"]').addClass('current');

				it.next(prop);
			} ,
			function(it, prop){
				// 表示サイズと位置合わせ
				$(window).resize();
				it.next(prop);
			} ,
			function(it, prop){
				callback();
			}
		]);
		return;
	}
}

},{"iterate79":4}],9:[function(require,module,exports){
/**
 * pageSearch.js
 */
module.exports = function(app, px, pj, $elms){
	var it79 = require('iterate79');
	var _this = this;
	var fileterTimer;
	var _sitemap = null;
	var _workspaceSearchKeywords='',
		_workspaceSearchListLabel='title';

	/**
	 * フィルター機能の初期化
	 */
	this.init = function( callback ){
		callback = callback || function(){};

		$elms.searchList.hide(); // 普段は隠しておく

		it79.fnc({}, [
			function(it, prop){
				// --------------------------------------
				// ページ検索機能
				$elms.workspaceSearch.find('form#cont_search_form')
					.on('submit', function(e){
						_workspaceSearchKeywords = $elms.workspaceSearch.find('input[type=text]').val();
						_this.search(function(){});
						return false;
					})
				;
				$elms.workspaceSearch.find('input[type=radio][name=list-label]')
					.off('change')
					.on('change', function(){
						_workspaceSearchListLabel = $elms.workspaceSearch.find('input[type=radio][name=list-label]:checked').val();
						// console.log(_workspaceSearchListLabel);
						clearTimeout(fileterTimer);
						fileterTimer = setTimeout(function(){
							_this.search(function(){});
						}, 1000);
					})
				;
				it.next(prop);
			} ,
			function(it, prop){
				callback();
			}
		]);
		return;
	}

	/**
	 * 検索実行
	 */
	this.search = function( callback ){
		callback = callback || function(){};
		var maxHitCount = 200;
		var hitCount = 0;
		$elms.searchList.hide(); // 一旦隠す
		if( !_workspaceSearchKeywords.length ){
			callback();
			return;
		}

		it79.fnc({}, [
			function(it, prop){
				if( _sitemap === null ){
					pj.site.updateSitemap(function(){
						_sitemap = pj.site.getSitemap();
						if( _sitemap === null ){
							px.message('[ERROR] サイトマップが正常に読み込まれていません。');
						}
						it.next(prop);
					});
					return;
				}
				it.next(prop);
			} ,
			function(it, prop){
				var $ul = $('<ul class="listview">');
				// $elms.searchList.text( JSON.stringify(_sitemap) );

				new Promise(function(rlv){rlv();})
					.then(function(){ return new Promise(function(rlv, rjt){
						current = (typeof(current)==typeof('')?current:'');

						$elms.searchList.html('').append($ul);

						function isMatchKeywords(target){
							if( typeof(target) != typeof('') ){
								return false;
							}
							if( target.match(_workspaceSearchKeywords) ){
								return true;
							}
							return false;
						}
						it79.ary(
							_sitemap,
							function( it1, row, idx ){
								// console.log(_sitemap[idx].title);
								if( _workspaceSearchKeywords.length ){
									if(
										!isMatchKeywords(_sitemap[idx].id) &&
										!isMatchKeywords(_sitemap[idx].path) &&
										!isMatchKeywords(_sitemap[idx].content) &&
										!isMatchKeywords(_sitemap[idx].title) &&
										!isMatchKeywords(_sitemap[idx].title_breadcrumb) &&
										!isMatchKeywords(_sitemap[idx].title_h1) &&
										!isMatchKeywords(_sitemap[idx].title_label) &&
										!isMatchKeywords(_sitemap[idx].title_full)
									){
										// console.log('=> skiped.');
										it1.next();
										return;
									}
								}
								if(hitCount >= maxHitCount){
									// 検索件数上限を越えた場合
									$elms.searchList.append( $('<p>')
										.text('検索数が '+maxHitCount+'件 をこえました。')
									);
									rlv();
									return;
								}
								hitCount ++;
								$ul.append( $('<li>')
									.append( $('<a>')
										.text( function(){
											return _sitemap[idx][_workspaceSearchListLabel];
										} )
										.attr( 'href', 'javascript:;' )
										.attr( 'data-id', _sitemap[idx].id )
										.attr( 'data-page-path', _sitemap[idx].path )
										.attr( 'data-content', _sitemap[idx].content )
										.css({
											// ↓暫定だけど、階層の段をつけた。
											'padding-left': (function(pageInfo){
												if( _workspaceSearchListLabel != 'title' ){ return '1em'; }
												if( !_sitemap[idx].id.length ){ return '1em'; }
												if( !_sitemap[idx].logical_path.length ){ return '2em' }
												var rtn = ( (_sitemap[idx].logical_path.split('>').length + 1) * 1.3)+'em';
												return rtn;
											})(_sitemap[idx]),
											'font-size': '12px'
										})
										.on('click', function(){
											app.goto( $(this).attr('data-page-path'), {"force":true}, function(){} );
										} )
									)
								);
								it1.next();
							},
							function(){
								rlv();
							}
						);
					}); })
					.then(function(){ return new Promise(function(rlv, rjt){
						it.next(prop);
					}); })
				;
			} ,
			function(it, prop){
				$elms.searchList.show();
				if(!hitCount){
					$elms.searchList.html('').append( $('<p>')
						.text('該当するページがありません。')
					);
				}
				it.next(prop);
			} ,
			function(it, prop){
				// カレント表示反映
				var current = app.getCurrentPageInfo();
				// console.log(current.page_info.id);
				try {
					$elms.searchList.find('a').removeClass('current');
					$elms.searchList.find('a[data-id="'+current.page_info.id+'"]').addClass('current');
				} catch (e) {
				}
				it.next(prop);
			} ,
			function(it, prop){
				// ページ一覧の表示更新
				callback();
			}
		]);
		return;
	}
}

},{"iterate79":4}]},{},[6])