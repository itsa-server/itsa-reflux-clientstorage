'use strict';

var isNode = (typeof global!=='undefined') && ({}.toString.call(global)==='[object global]') && (!global.document || ({}.toString.call(global.document)!=='[object HTMLDocument]')),
    alreadySet = false,
    WINDOW = isNode ? {} : window,
    objectAssign = require('object-assign'),
    localStorage = require('./lib/localstorage'),
    KEY_ID = 'itsaRefluxClientStorage',
    MIN_SESSION_BROWSERS_NO_HISTORY = 3600, // sec
    lastState;

var setupListener = function(storeName) { // do not use arrow function!
    if (alreadySet) {
        return;
    }
    // make sure only one listeners kieeps running:
    alreadySet = true;
    var eventHandler = function(triggerState) {
        // triggerState is an array where every item is an argument of the triggerFn
        objectAssign(lastState, triggerState[0]);
        localStorage.setItem(KEY_ID+storeName, {time: Date.now(), state: lastState});
    };
    this.emitter.addListener('change', eventHandler);
};

var isBrowserWithHistory = function() {
    // only activated to browsers with history-support
    return (WINDOW.history && WINDOW.history.pushState);
};

var RefluxClientStorageMixin = {
    envBrowser: function() {
        return !isNode;
    },

    readStateFromClientStorage: function(storeName, initialState) {
        var localState;
        if (!initialState) {
            initialState = storeName;
            storeName = '';
        }
        else {
            storeName = '@' + storeName;
        }
        if (this.envBrowser() && localStorage) {
            var controller = require('itsa-client-controller');
            var sessionTime = controller.getProps().__sessiontime;
            controller.init();
            if (!isBrowserWithHistory()) {
                // force a specific sessiontime, to prevent stateloses during navigation
                sessionTime = Math.max(sessionTime, MIN_SESSION_BROWSERS_NO_HISTORY);
            }
            localState = localStorage.getItem(KEY_ID+storeName, true);

            if (localState && localState.time && (localState.time>(Date.now()-(1000*sessionTime)))) {
                initialState = objectAssign({}, initialState, localState.state);
            }
            localStorage.setItem(KEY_ID+storeName, {time: Date.now(), state: initialState});
            setupListener.call(this, storeName);
        }
        lastState = objectAssign({}, initialState);
        return initialState;
    }

};

module.exports = RefluxClientStorageMixin;
