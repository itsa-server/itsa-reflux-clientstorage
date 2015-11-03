'use strict';

var isNode = (typeof global!=='undefined') && ({}.toString.call(global)==='[object global]') && (!global.document || ({}.toString.call(global.document)!=='[object HTMLDocument]'));
var alreadySet = false;

var WINDOW = isNode ? {} : window,
    objectAssign = require('object-assign'),
    localStorage = require('./lib/localstorage'),
    KEY_ID = 'itsaRefluxClientStorage',
    MIN_SESSION_BROWSERS_NO_HISTORY = 3600; // sec

var setupListener = function() { // do not use arrow function!
    if (alreadySet) {
        return;
    }
    // make sure only one listeners kieeps running:
    alreadySet = true;
    var eventHandler = function(triggerState) {
        // triggerState is an array where every item is an argument of the triggerFn
        var newState = {};
        objectAssign(newState, triggerState[0]);
        localStorage.setItem(KEY_ID, {time: Date.now(), state: newState});
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

    readStateFromClientStorage: function(initialState) {
        var localState;
        if (this.envBrowser() && localStorage) {
            var controller = require('itsa-client-controller');
            var sessionTime = controller.getProps().__sessiontime;

            if (!isBrowserWithHistory()) {
                // force a specific sessiontime, to prevent stateloses during navigation
                sessionTime = Math.max(sessionTime, MIN_SESSION_BROWSERS_NO_HISTORY);
            }
            localState = localStorage.getItem(KEY_ID, true);

            if (localState && localState.time && (localState.time>(Date.now()-(1000*sessionTime)))) {
                objectAssign(initialState, localState.state);
            }
            setupListener.call(this);
        }
        return initialState;
    }

};

module.exports = RefluxClientStorageMixin;
