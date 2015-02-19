;(function (root, factory) {

	if (typeof define === 'function' && define.amd) {
		define(['backbone', 'underscore', 'context'], function (Backbone, _, context) {
			return factory(root, Backbone, _, context);
		});
	}
	else if (typeof exports !== 'undefined') {
		var Backbone = require('backbone');
		var _ = require('underscore');
		var context = require('context');
		module.exports = factory(root, Backbone, _, context);
	}
	else {
		root.Network = factory(root, root.Backbone, root._, root.context);
	}

}(this, function (root, Backbone, _, context) {

	var Network = module.exports = function Network(options) {
		this.cache = {};
		this.context = options.context || context;
		this.context.online = navigator.onLine;

		if (navigator.connection) {
			this._connection = navigator.connection;
		}

		document.addEventListener("online", _.bind(this.onOnline, this), false);
		document.addEventListener("offline", _.bind(this.onOffline, this), false);

	};
	_.extend(Network.prototype, Backbone.Events);

	Network.middleware = function middleware() {
		return function (ctx, next) {
			ctx.network = new Network({
				context: ctx
			});
			return next();
		};
	};

	Network.prototype.onOnline = function onOnline(){
		this.trigger( "online" );
		this.context.online = true;
	};

	Network.prototype.onOffline = function onOffline(){
		this.trigger( "offline" );
		this.context.online = false;
	};

	Network.prototype.add = function add( name, xhr ){

		var self = this;

		if ( !name || !xhr )
			throw new Error('Cannot add xhr request');

		// Controllo se esiste un XHR nella cache
		this.close( name );

		this.cache[name] = xhr;
		this.cache[name].always(function( jqXHR, textStatus, errorThrown ){
			self.close( name );
		});

		return this;
	};

	Network.prototype.close = function close( name ){
		
		if ( this.cache[name] ){
			if ( this.cache[name].abort )
				this.cache[name].abort();
			delete this.cache[name];
		}

		return this;
	};

	Network.prototype.clear = function clear(){
		var self = this;
		_(self.cache).forEach(function(anXHR, key){
			self.close( key );
		});
		return this;
	};

	return Network;

}));