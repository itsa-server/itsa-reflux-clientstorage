# itsa-reflux-clientstorage

Mixin for Reflux that stores and loads state to the local storage during a session.
This is very useful in these 2 cases:

* When you want to retain the state when the user navigates away and turns back
* In case you setup an environment for IE<10 when not using history. In such cases, the webapplication will be setup to laod every single page as a whole and would loose the state.
