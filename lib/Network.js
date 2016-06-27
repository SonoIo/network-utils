;(function (root, factory) {

	if (typeof define === 'function' && define.amd) {
		define(['backbone', 'underscore'], function (Backbone, _ ) {
			return factory(root, Backbone, _ );
		});
	}
	else if (typeof exports !== 'undefined') {
		var Backbone = require('backbone');
		var _ = require('underscore');
		module.exports = factory(root, Backbone, _ );
	}
	else {
		root.Network = factory(root, root.Backbone, root._ );
	}

}(this, function (root, Backbone, _) {

	var Network = module.exports = function Network(options) {
		this.cache            = {};
		this.context          = options.context;
		this.backbone         = options.backbone || Backbone;
		this.abortNewRequests = typeof options.abortNewRequests !== 'undefined' ? options.abortNewRequests : false;

		if ( this.context )
			this.context.online   = navigator.onLine;

		if (navigator.connection) {
			this._connection = navigator.connection;
		}

		document.addEventListener("online", _.bind(this.onOnline, this), false);
		document.addEventListener("offline", _.bind(this.onOffline, this), false);

		// Esegue l'add automaticamente delle richieste che passano da Backbone
		// ed hanno impostato un nome in options.network
		var self = this;
		this.originalSync = this.backbone.sync;
		this.backbone.sync = function (method, model, options) {
			model.once('request', function (model, xhr, options) {
				self.onBackboneRequest(model, xhr, options);
			});
			self.originalSync.apply(this, arguments);
		};
	};
	_.extend(Network.prototype, Backbone.Events);

	Network.middleware = function middleware(options) {
		if (!options) options = {};
		return function (ctx, next) {
			ctx.network = new Network({
				context: ctx,
				backbone: options.backbone
			});
			return next();
		};
	};

	Network.prototype.onOnline = function onOnline(){
		this.trigger( "online" );
		if ( this.context )
			this.context.online = true;
	};

	Network.prototype.onOffline = function onOffline(){
		this.trigger( "offline" );
		if ( this.context )
			this.context.online = false;
	};

	Network.prototype.add = function add( name, xhr ) {
		var self = this;

		if ( !name || !xhr )
			throw new Error('Cannot add xhr request');

		if (this.exists(name)) {
			// Se esiste già una chiamata con lo stesso nome allora
			// la blocco immediatamente lasciando il tempo a quella
			// vecchia di terminare
			if (this.abortNewRequests) {
				if (anXHR.abort) xhr.abort();
				return;
			}
			// In alternativa chiudo la chiamata precedente per inserire
			// al suo posto quella nuova
			else {
				this.close(name);
			}
		}

		// Handler di chiusura dell'XHR
		xhr.always(function( jqXHR, textStatus, errorThrown ) {
			self.close( name );
		});

		var cache = this.cache;
		var names = this._splitName(name);

		_.forEach(names, function (aName) {
			if (!cache[aName]) cache[aName] = [];
			cache[aName].push(xhr);
		});

		return this;
	};

	Network.prototype.close = function close(name) {
		if (!this.exists(name)) return;

		var cache = this.cache;
		var xhrs  = this.cache[name];
		var names = this._splitName(name);

		// Stoppa le chiamate in corso
		_.forEach(xhrs, function (anXHR) {
			if (anXHR.abort) anXHR.abort();
		});

		// Rimuove le XHR dalla cache
		_.forEach(names, function (aName) {
			if (_.isEmpty(cache[aName])) return;
			cache[aName] = without(cache[aName], xhrs);
			if (_.isEmpty(cache[aName])) delete cache[aName];
		});

		return this;

		function without(a, b) {
			var result = [];
			var index;
			_.forEach(a, function (anItemOfA) {
				if (b.indexOf(anItemOfA) === -1)
					result.push(anItemOfA);
			});
			return result;
		}
	};

	Network.prototype.exists = function exists(name) {
		return !_.isEmpty(this.cache[name]);
	};

	Network.prototype.clear = function clear(){
		var self = this;
		_(self.cache).forEach(function(anXHR, key){
			self.close( key );
		});
		return this;
	};

	Network.prototype.onBackboneRequest = function onBackboneRequest(model, xhr, options) {
		if (options.network) {
			this.add(options.network, xhr);
		}
	};

	Network.prototype._splitName = function _splitName(name) {
		var result = [];
		var chunks = name.split(':');
		var aName;
		for (var i = 0; i < chunks.length; i++) {
			aName = [];
			for (var k = 0; k <= i; k++) {
				aName.push(chunks[k]);
			}
			result.push(aName.join(':'));
		}
		return result;
	};

	return Network;

}));
