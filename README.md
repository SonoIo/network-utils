
# Network

Overwrite `sync` method of Backbone to track every fetch, save, etc... that contains a `network` option.

## Usage

```
var Backbone = require('backbone');
var Network = require('network-utils');
var network = new Network({
	abortNewRequests: false,
	performanceEnabled: false
});
```

**abortNewRequests**: Default false. If *true* a new request with the same name of an existing one is called the new request is aborted.
If *false* the old request is aborted and the new one continue.

**performanceEnabled**: Default: false. If *true* every network request is tracked and will be available from `getPerformanceEntries` method.

## Example

```
// Initialize network
var network = new Network({
	abortNewRequests: false
});

var MyCollection = require('./my-collection.js');
var myCollection = new MyCollection();

// Fetch a collection
myCollection.fetch({
	network: 'fetch:mycollection',
	success: function () {
		console.log('The first wins!');
	}
});

// Fetch the same collection after 0ms
setTimeout(function() {
	myCollection.fetch({
		network: 'fetch:mycollection',
		success: function () {
			console.log('The second wins!');
		}
	});
}, 0);

// Print
// The second wins!
```

## Events

Notify when browser goes online/offline through Backbone.Events.
Keeps track of XHR requests and add functionalities like:
- *add* a request with name;
- *clear* all pending requests;
- *close* a request by name.
