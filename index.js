'use strict';

let isNode = (typeof global!=='undefined') && ({}.toString.call(global)==='[object global]') && (!global.document || ({}.toString.call(global.document)!=='[object HTMLDocument]'));
let alreadySet = false;

const WINDOW = isNode ? {} : window,
      localStorage = require('./lib/localstorage'),
      KEY_ID = 'itsaRefluxClientStorage',
      MIN_SESSION_BROWSERS_NO_HISTORY = 3600; // sec

const setupListener = function() { // do not use arrow function!
    if (alreadySet) {
        return;
    }
    // make sure only one listeners kieeps running:
    alreadySet = true;
    const eventHandler = triggerState => {
        // triggerState is an array where every item is an argument of the triggerFn
        let newState = {};
        Object.assign(newState, triggerState[0]);
        localStorage.setItem(KEY_ID, {time: Date.now(), state: newState});
    };
    this.emitter.addListener('change', eventHandler);
};

const isBrowserWithHistory = () => {
    // only activated to browsers with history-support
    return (WINDOW.history && WINDOW.history.pushState);
};

const RefluxClientStorageMixin = {
    envBrowser() {
        return !isNode;
    },

    readStateFromClientStorage(initialState) {
        let localState;
        if (this.envBrowser() && localStorage) {
            let controller = require('itsa-client-controller');
            let sessionTime = controller.getProps().__sessiontime;

            if (!isBrowserWithHistory()) {
                // force a specific sessiontime, to prevent stateloses during navigation
                sessionTime = Math.max(sessionTime, MIN_SESSION_BROWSERS_NO_HISTORY);
            }
            localState = localStorage.getItem(KEY_ID, true);

            if (localState.time && (localState.time>(Date.now()-(1000*sessionTime)))) {
                Object.assign(initialState, localState.state);
            }
            setupListener.call(this);
        }
        return initialState;
    }

};

module.exports = RefluxClientStorageMixin;
