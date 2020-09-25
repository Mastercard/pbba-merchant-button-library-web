/** Copyright (c) 2020 Mastercard

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

window.zapppopup = window.zapppopup || {};
var TP_COOKIE_DISABLED_COOKIE = "TPCookieDisabled";
var cfiLogosShort = [];
var cfiLogosLong = [];
var cfiLogosShuffled = [];
var logoData;
(function() {

	zapppopup._readyCallbacks = [];
	zapppopup._readyCallback = false;

	if (!zapppopup.registerEventHandler) {

		zapppopup.events = {};

		zapppopup.registerEventHandler = function(name, fn) {
			if (typeof zapppopup.events[name] === "undefined")
				zapppopup.events[name] = [];
			zapppopup.events[name].push(fn);
		};

		zapppopup.triggerEvent = function(name, args) {
			if (typeof zapppopup.events[name] === "undefined")
				return;
			for (var idx = 0; idx < zapppopup.events[name].length; idx++)
				zapppopup.events[name][idx](args);
		};

	}

	zapppopup.documentReady = function(callback) {
		try {
			zapppopup._readyCallbacks.push(callback);
			if (zapppopup._readyCallback)
				return;
			document.onreadystatechange = function() {
				if (document.readyState === "complete")
					for (var i = 0; i < zapppopup._readyCallbacks.length; i++)
						zapppopup._readyCallbacks[i]();
			};
			zapppopup._readyCallback = true;
		} catch (err) {
			return;
		}
	};

	zapppopup.registerXEventHandler = function(events, target) {

		zapppopup.bindEvent("message", function(ev) {

			try {
				data = JSON.parse(ev.data);
			} catch (err) {
				return;
			}

			if (typeof data.eventType === "undefined"
					|| data.eventType.indexOf("com.zapp") == -1)
				return;

			if (!events[data.eventType]) {
				return;
			}

			if (typeof events[data.eventType] !== "function") {
				return;
			}

			events[data.eventType](data);

		}, target);

	};

	zapppopup.extendObj = function() {
		var obj = {};
		for ( var idx in arguments) {
			if (typeof (arguments[idx]) !== "object")
				continue;
			for ( var prop in arguments[idx])
				obj[prop] = arguments[idx][prop];
		}
		return obj;
	};

	/**
	 *
	 * @param elem
	 * @returns {{document: {top: number, left: number, right: number, bottom: number}, window: {top: Number, left: Number, right: number, bottom: number}, height: Number, width: Number}}
	 */
	zapppopup.getBoundingClient = function(elem) {
		var box = elem.getBoundingClientRect();

		var getSize = function(prop) {
			var doc = elem.ownerDocument, docElem = doc.documentElement, body = doc.body;
			return docElem[prop] || body[prop] || 0;
		};

		return {
			document : {
				top : box.top + getSize('scrollTop') - getSize('clientTop'),
				left : box.left + getSize('scrollLeft') - getSize('clientLeft'),
				right : getSize('clientWidth') - box.right,
				bottom : getSize('clientHeight') - box.bottom
			},
			window : {
				top : box.top,
				left : box.left,
				right : window.screen.width - box.right,
				bottom : window.screen.height - box.bottom
			},
			height : box.bottom - box.top,
			width : box.right - box.left
		};
	};

	/**
	 *
	 * @param url
	 */
	zapppopup.addCssFile = function(url) {
		var script = document.createElement('link');
		script.setAttribute('type', 'text/css');
		script.setAttribute('rel', 'stylesheet');
		script.setAttribute('media', 'all');
		script.setAttribute('href', url);
		document.getElementsByTagName('head')[0].appendChild(script);
	};

	/**
	 * Bind the callback to an event
	 *
	 * @param {string} eventName
	 * @param {function} callback
	 * @param {Element} target
	 * @returns {undefined}
	 */
	zapppopup.bindEvent = function(eventName, callback, target) {
		target = target || window;
		if (typeof (target.addEventListener) !== "undefined") {
			target.addEventListener(eventName, callback, false);
		} else if (typeof (target.attachEvent) !== "undefined") {
			target.attachEvent("on" + eventName, callback);
		} else {
			target["on" + eventName] = callback;
		}
	};

	/**
	 * @param {string} className description
	 */
	zapppopup.hasClassName = function(ele, className) {
		return (' ' + ele.className + ' ').indexOf(' ' + className + ' ') > -1;
	};

	/**
	 * @param {string} className description
	 */
	zapppopup.addClassName = function(ele, className) {
		if (zapp.hasClassName(ele, className))
			return ele;
		var a = ele.className + " " + className;
		ele.className = a[0] === " " ? a.substring(1, a.length) : a;
		return ele;
	};

	/**
	 * @param {string} className description
	 */
	zapppopup.removeClassName = function(ele, className) {
		if (!zapp.hasClassName(ele, className))
			return ele;
		var a = " " + ele.className + " ", b = " " + className + " ", c = a
				.indexOf(b), d = a.substring(0, c) + " "
				+ a.substring(c + b.length, a.length);
		ele.className = d.substring(1, d.length - 1);
		return ele;
	};

	/**
	 *
	 * @param name
	 * @returns {string}
	 */
	zapppopup.getParameterByName = function(name) {
		try {
			name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex
					.exec(location.search);
			return results === null ? "" : decodeURIComponent(results[1]
					.replace(/\+/g, " "));
		} catch (err) {

		}
	};

	zapppopup.deleteCookie = function(name) {

		document.cookie = name
				+ '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
	}

	zapppopup.cookieExists = function(cookie) {
		return (document.cookie.indexOf(cookie) != -1) ? true : false;
	};

	zapppopup.isTPCookieDisabled = function() {
		return zapppopup.cookieExists(TP_COOKIE_DISABLED_COOKIE);
	};

	zapppopup.redirectToCookieManagementUrl = function(url) {

		var xmlhttp = new XMLHttpRequest();

		if (xmlhttp.withCredentials === undefined) {
			xmlhttp = new XDomainRequest();
		}

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE) {
				if (xmlhttp.status == 200) {
					console.log(url + " is reachable.");
					setTimeout(function() {
						window.location.href = url
								+ "index.html";
					}, 10);
					zapppopup.deleteCookie(TP_COOKIE_DISABLED_COOKIE);
				}
			}
		};

		xmlhttp.open("HEAD", url + "index.html", true);
		xmlhttp.send();
	};

	zapppopup.setHasAppCookie = function(cookieManagementUrl) {

		var ele = document.getElementById("zappAction");
		if (!ele) {
			ele = document.createElement("iframe");
			ele.style.display = "none";
			ele.id = "zappAction";
		}
		if (typeof zapp != "undefined" && typeof zapp.options != "undefined")
			ele.setAttribute("src", zapp.options.cookieManagementUrl
					+ "set-app-cookie.html");
		else if (typeof zapppopup != "undefined"
				&& typeof zapppopup.options != "undefined")
			ele.setAttribute("src", zapppopup.options.cookieManagementUrl
					+ "set-app-cookie.html");
		else if (cookieManagementUrl != null && cookieManagementUrl != "")
			ele.setAttribute("src", cookieManagementUrl
					+ "set-app-cookie.html");

		document.body.appendChild(ele);

	};

	zapppopup.setAppCookie = function(cookieManagementUrl) {
		if (zapppopup.isTPCookieDisabled()) {
			zapppopup.redirectToCookieManagementUrl(cookieManagementUrl);
			setTimeout(function() {
				zapppopup.setHasAppCookie(cookieManagementUrl);
			}, 1000);
		} else {
			zapppopup.setHasAppCookie(cookieManagementUrl);
		}

	};

	zapppopup.removeAppCookie = function(cookieManagementUrl) {
		var ele = document.getElementById("zappAction");
		if (!ele) {
			ele = document.createElement("iframe");
			ele.style.display = "none";
			ele.id = "zappAction";
		}
		if (typeof zapp != "undefined" && typeof zapp.options != "undefined")
			ele.setAttribute("src", zapp.options.cookieManagementUrl
					+ "remove-app-cookie.html");
		else if (typeof zapppopup != "undefined"
				&& typeof zapppopup.options != "undefined")
			ele.setAttribute("src", zapppopup.options.cookieManagementUrl
					+ "remove-app-cookie.html");
		else if (cookieManagementUrl != null && cookieManagementUrl != "")
			ele.setAttribute("src", cookieManagementUrl
					+ "remove-app-cookie.html");

		document.body.appendChild(ele);

	};

	/**
	 *
	 * @param c_name
	 * @returns {HTMLCollection}
	 */
	zapppopup.getCookie = function(c_name) {
		var c_value = document.cookie;

		var c_start = c_value.indexOf(" " + c_name + "=");
		if (c_start === -1) {
			c_start = c_value.indexOf(c_name + "=");
		}
		if (c_start === -1) {
			c_value = null;
		} else {
			c_start = c_value.indexOf("=", c_start) + 1;
			var c_end = c_value.indexOf(";", c_start);
			if (c_end === -1) {
				c_end = c_value.length;
			}
			c_value = unescape(c_value.substring(c_start, c_end));
		}
		return c_value;
	};

	function parent_disable() {
		if(moreAboutIframe && !moreAboutIframe.closed)
			moreAboutIframe.focus();
	}
	
	showMoreAboutPopup = function() {
		var moreAboutIframe = document.getElementById('moreAboutIframe');
		if (moreAboutIframe) {
			document.body.removeChild(moreAboutIframe);
		}
		moreAboutIframe = document.createElement('iframe');
		moreAboutIframe.setAttribute("class", "more-about-iframe");
		moreAboutIframe.setAttribute("id", "moreAboutIframe");
		moreAboutIframe.src = zapppopup.libUrl + "/html/more-about.html?url="
				+ zapppopup.options.cfiLogosURL;
		document.body.appendChild(moreAboutIframe);
	}

	closeMoreAboutPopup = function() {
		var moreAboutIframe = document.getElementById('moreAboutIframe');
		if (moreAboutIframe) {
			document.body.removeChild(moreAboutIframe);
		}
	}

	closeBRNPopup = function() {
		var brnIframe = document.getElementById('brnIframe');
		if (brnIframe) {
			document.body.removeChild(brnIframe);
		}
	}

	/**
	 * @parm {array} array
	 * This function is created to Shuffle array of logos
	 **/
	randomise = function(array) {
		var length;

		if (array.length > 8) {
			length = 8;
		} else {
			length = array.length;
		}

		for (var i = length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
		return array;
	}

	/**
	 * @parm {string} file
	 * This function is created to read JSON file and extract CFI logos 
	 */
	readJSONFile = function(file) {
		if (file == "undefined" || file == null || file.length <= 0) {
			return;
		}
		if (cfiLogosShort.length > 0) {
			return;
		}
		var request = new XMLHttpRequest();
		if (request.overrideMimeType) {
			request.overrideMimeType("application/json");
		}
		request.open("GET", file, true);
		request.send(null);
		request.onload = function() {
			var type = request.getResponseHeader('Content-Type');
			if (type.indexOf("json") !== 1) {
				var data = JSON.parse(request.responseText);
				logoData = data;
				for (var i = 0; i < data.length; i++) {
					var obj = data[i];
					if (obj.longLogo != undefined && obj.longLogo.length > 0) {
						cfiLogosLong[obj.name] = obj.longLogo;
					}
					if(obj.shortLogo != undefined && obj.shortLogo.length > 0) {
						cfiLogosShort[obj.name] = obj.shortLogo;
					}
				}
			}

		};
	}
	
	getCfiLogosLong = function(shuffled) {
		if (shuffled) {
			cfiLogosShuffled = randomise(cfiLogosLong);
			return cfiLogosShuffled;
		} else {
			return cfiLogosLong;
		}
	}

	/*
	 * function return array of logos based on flagged passed
	 * @param {boolean} shuffled
	 * @return {array}
	 */
	getCfiLogosShort = function(shuffled) {
		if (shuffled) {
			cfiLogosShuffled = randomise(cfiLogosShort);
			return cfiLogosShuffled;
		} else {
			return cfiLogosShort;
		}
	}
	
	/*
	 * function return array of logos in a random order
	 * @return {array}
	 */
	getCfiLogos = function() {
		return randomise(cfiLogosShort);
	}
	
    getIntegratedBtnLogo =  function() {
    	return zapppopup.libUrl+"/images/pbba-logo-black-horizontal_svg.svg";
	} 
    
    getMoreAboutLinkWithPaySecureText = function() {
    	return '<div class="moreAboutDivLeft"><a id="moreAboutPopupWithPaySecureTextLink" class="moreAboutLink" >Pay securely using your own banking app<p class="moreAboutText underline">More about Pay by Bank app ></p></a></div>';
    }
    
    getMoreAboutLinkWithoutPaySecureText = function() {
    	return '<div class="moreAboutDivLeft"><a id="moreAboutPopupWithoutPaySecureTextLink" class="moreAboutLink" ><p class="moreAboutText underline">More about Pay by Bank app ></p></a></div>';
    }
    
})();

// Fire Loaded Event (This comes last to make sure the methods have been loaded)
setTimeout(function() {
	if (zapppopup.triggerEvent)
		zapppopup.triggerEvent("com.zapp.extras.loaded");
}, 200);
