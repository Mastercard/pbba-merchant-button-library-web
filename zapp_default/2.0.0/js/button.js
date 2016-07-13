/**
 * Created by andy on 16/06/2014.
 */

(function() {

    zapp.events = {};

    function removePopup(self) {
    	
    	if (document.getElementById('cover') != "undefined")
    		document.getElementById('cover').remove();
    	
    	self._finish();
    }
    
    function addMethods(proto, methods)
    {
        for (var methodSig in methods)
        {
            proto[methodSig] = methods[methodSig];
        }
    }

    addMethods(zapp, {
        paymentNotificationCookie: "zappPaymentNotificationStatus",
        isMobile: function()
        {
            return zapp.platformSupportsZapp();
        },
        isTablet: function()
        {
            return (zapp.isMobile() && (navigator.userAgent.match('iPad') || !navigator.userAgent.match(/mobile/i)));
        },
        platformSupportsZapp: function()
        {
            var isiOS = navigator.userAgent.match(/iPhone|iPod|iPad/);
            var isAndroid = navigator.userAgent.match(/Android/);
            return (isiOS || isAndroid) ? true : false;
        },
        registerEventHandler: function(name, fn)
        {
            if (typeof zapp.events[name] === "undefined")
                zapp.events[name] = [];
            zapp.events[name].push(fn);
        },
        triggerEvent: function (name, args)
        {
            if (typeof zapp.events[name] === "undefined")
                return;
            for (var idx = 0; idx < zapp.events[name].length; idx ++)
                zapp.events[name][idx](args);
        },
        _init: function()
        {

           var self = this;

        	zapp.addJsFile(this.libUrl + "/js/extras.js");
            zapp.addJsFile(this.libUrl + "/js/zapp-popup.js");
            zapp.addJsFile(this.libUrl + "/js/cookie-management.js");
            
            self.registerEventHandler('com.zapp.extras.loaded', function () {
        		self.addCssFile(zapp.libUrl + "/css/zapp.css");

        		self.registerXEventHandler({
                    "com.zapp.button.click": function(data) {
                    	self.pcid = data.pcid;
                    	self.hasApp = data.hasApp;
                        var button = zapp._getButtonWithId(data.id);
                        button.click();
                    },
                    "com.zapp.popup.size": function(data) {
                    	zapppopup._positionContextPopup(data.data);
                    },
                    "com.zapp.popup.size2": function(data) {
                    	zapppopup._positionContextPopup2(data.data);
                    },
                    "com.zapp.button.openapp.click": function(data) {
                    	zapppopup._invokeApp(data);
                    },
                    "com.zapp.button.regen.click": function(data) {
                    	self._getButtonWithId(data.id)._pay();
                    },
                    "com.zapp.popup.close": function(data) {
                    	self._getButtonWithId(data.id)._finish();
                    },
                    "com.zapp.transaction.timeout": function(data) {
                    	self._getButtonWithId(data.id)._transactionTimeout();
                    }
                });

                setTimeout(function() {
                	self._setupButtons();
                }, 50);
            })
        },
        _getButtonWithId: function(id)
        {
            return this.buttonItems[id];
        },
        _setupButtons: function() {
            for (var idx in this.buttonItems)
            {
                this.buttonItems[idx]._setupButton();
            }
        },
        notify: function(response)
        {

        }
    });

    addMethods(zapp.button.prototype, {
        canStartNewPayment: function()
        {
            if (this._ongoingTransaction())
                return false;
            if (!this.enabled)
                return false;
            if (this.retryTimestamp >= new Date().getTime())
                return false;
            return true;
        },
        click: function()
        {
            if (!this.canStartNewPayment()) {
                console.log('Cannot start new payment');
                this._finish();
                return;
            }
            this._pay();
        },
        _ongoingTransaction: function()
        {
            return (this.activeTransaction || this.pendingTransaction);
        },
        _setupButton: function()
        {
            var self = this;
            var imageKey = 1;
            var imageSrc = "";
            var imagePrefix = "button_pbba_";
            var defaultImageSuffix = ".png";
            var imageSuffix = ".svg";
            var defaultImagePath= "../images/";
            var coBrandedImagePath = "../images/co-branding/";
            if (zapp != undefined && zapp.options.imageKey != undefined) {
            	imageKey = zapp.options.imageKey;
            }
            switch (imageKey) {
            
            case 1: imageSrc = defaultImagePath+imagePrefix+imageKey+defaultImageSuffix;
            					break;
            case 2: imageSrc = coBrandedImagePath+imagePrefix+imageKey+imageSuffix;
								break;
            case 3: imageSrc = coBrandedImagePath+imagePrefix+imageKey+imageSuffix;
								break;
            default: imageKey = 1;
            		 imageSrc = defaultImagePath+imagePrefix+imageKey+defaultImageSuffix;
            		 break;
            					
            }
            if (typeof this.options["paymentType"] === "undefined")
                this.options.paymentType = zapp.paymentType.instant;
            if (typeof this.options["checkoutType"] === "undefined")
                this.options.checkoutType = zapp.checkoutType.quick;
            if (typeof this.options["deliveryType"] === "undefined")
                this.options.deliveryType = zapp.deliveryType.address;
            this.options.isMobile = zapp.isMobile();

            var queryString = 'src=' + imageSrc + '&id=' + self.id +'&imageKey='+ imageKey;
            if (typeof self.options['cornerRadius'] !== "undefined")
                queryString += "&cornerRadius=" + params['cornerRadius'];
            if (typeof self.options['backgroundColor'] !== "undefined")
                queryString += "&backgroundColor=" + params['backgroundColor'];
            var height = self.ele.clientHeight;
            if (height == 0)
                height = 46;
            self.ele.innerHTML = '<iframe id="pbba-button-frame-'+self.id+'" src="' + zapp.libUrl + '/html/button.html?' + queryString + '" style="border: 0; scroll: none; display: block; height:' + height + 'px; width: 100%;" marginheight="0" marginwidth="0" frameborder="0"></iframe>';

            if (!zapp.isMobile())
            {

                self.ele.onmouseover = function () {
                    self._hover = true;
                    if (self._ongoingTransaction() || self.finishedTransaction)
                        return;
                   setTimeout(function () {
                    	   zapppopup._addPopup(self).sendMessage(self, "com.zapp.popup.state", "ready");
                   }, 100);
                };

                self.ele.onmouseout = function () {
                    self._hover = false;
                    setTimeout(function () {
                        if (!self._hover)
                        	zapppopup._removePopup(false, self._ongoingTransaction(), self.finishedTransaction);
                    }, 100);
                };
            }
        },
        _hover: false,
        pendingTransaction: false,
        activeTransaction: false,
        finishedTransaction: false,
        enabled: true,
        _setEnabled: function(enabled)
        {
            this.enabled = enabled;
            if (enabled)
                this._sendMessage("com.zapp.button.enable", []);
            else
                this._sendMessage("com.zapp.button.disable", []);
        },
        retryTimestamp: 0,
        _pay: function()
        {

            var self = this;

            self.pendingTransaction = true;

            self.retryTimestamp = new Date().getTime() + 10000;

            this._setEnabled(false);

            setTimeout(function() {
                if (!self._ongoingTransaction())
                    self._setEnabled(true);
            }, 10000);

            // Generate Browser Info
            this.options.browserInfo = {
                userAgent: navigator.userAgent,
                timeZone: "GMT",
                screen: screen.width+"x"+screen.height
            };

            this.options.pcid = zapp.pcid;

            zapp.options.pay(this.options, function(response) {

                // Was transaction request cancelled?
                if (!self.pendingTransaction)
                    return;

                self.pendingTransaction = false;

                if (!response instanceof zapppopup.response.payment)
                {
                    alert("error pay method expects return type of zapp.response.payment");
                    return false;
                }

                var popup = null;

                self.options.transaction = response;

                if (!response.success)
                {
                    self.finishedTransaction = true;
                    self._sendMessage("com.zapp.button.stop");
                    popup = zapppopup._addPopup(self).sendMessage(self, "com.zapp.popup.state", "requestFailure");
                    popup.ele.className = "";
                    return;
                }

                self.activeTransaction = true;
                
                if (zapp.hasApp)
                {
                	zapppopup._invokeApp(self);
                	 if (zapp.options.notify)
                     {
                         self._startNotification();
                     }
                    return;
                } 
                
                response.id = self.id;
                if (response.notificationSent && zapp.pcid)
                    response.pcid = zapp.pcid;
                
                if (zapp != undefined && zapp.options.imageKey != undefined && zapp.options.imageKey > 1) {
                	response.isCoBranded = true;
                }
                popup = zapppopup._addPopup(self).sendMessage(self, "com.zapp.popup.data", response);
                popup.ele.className = "";
                if (zapp.options.notify)
                {
                    self._startNotification();
                }
            });
        },
        _sendMessage: function(eventType, data)
        {
            var ele = this.ele.firstChild;

            var postData = {
                eventType: eventType,
                id: this.id,
                data: data
            };

            setTimeout(function() {
                ele.contentWindow.postMessage(JSON.stringify(postData), zapp.url);
            }, 5);

            return this;
        },
        _finish: function()
        {
            this.activeTransaction = false;
            this.pendingTransaction = false;
            this.finishedTransaction = false;
            if (this.retryTimestamp <= new Date().getTime())
                this._setEnabled(true);
            this._stopNotification();
            this._sendMessage("com.zapp.button.stop", []);
            zapppopup._removePopup(true);
        },
        _notifyTimer: null,
        _startNotification: function()
        {
        	var merchantPollInterval = 5000;
        	if (zapp != undefined && zapp.options.merchantPollInterval != undefined) {
        		merchantPollInterval = zapp.options.merchantPollInterval;
        	}
            var self = this;
            if (this._notifyTimer != null)
                return;
            this._notifyTimer = setInterval(function() {
                zapp.options.notify(self.options.transaction.secureToken, function (response) {
                    if (response.success)
                    {
                        self._notify(response);
                        zapp.notify(response);
                    }
                    else
                    {
                    	//removePopup(self);
                    }
                });
            }, merchantPollInterval);
            zapppopup._startTimers(self);
        },
        _transactionTimeout: function()
        {
        	var self = this;
        	self._stopNotification();
            self._sendMessage("com.zapp.button.stop", []);
            self.activeTransaction = false;
            self.finishedTransaction = true;
        },
        _stopNotification: function()
        {
            var timers = ["_notifyTimer"];
            for (var idx = 0; idx < timers.length; idx ++)
            {
                if (this[timers[idx]] == null)
                    continue;
                clearInterval(this[timers[idx]]);
                clearTimeout(this[timers[idx]]);
                this[timers[idx]] = null;
            }
            zapppopup._stopTimers();
        },
        _getCallbackUrlForBrowser: function()
        {

            var browsers = {
                "safari": { https: "https", http: "http" },
                "chrome": { https: "googlechromes", http: "googlechrome" },
                "opera": { https: "https", http: "http" },
                "firefox": { https: "https", http: "http" },
                "default": { https: "https", http: "http" }
            };

            var browser = "default";

            if (navigator.userAgent.match(/safari/i))
                browser = "safari";
            if (navigator.userAgent.match(/firefox/i))
                browser = "firefox";
            if (navigator.userAgent.match(/chrome/i))
                browser = "chrome";
            if (navigator.userAgent.match(/opera/i))
                browser = "opera";

            var a = document.createElement('a');
            a.href = zapp.options.callbackUrl;

            if (a.protocol != "https:" && a.protocol != "http:")
                return zapp.options.callbackUrl;

            var protocol = a.protocol.replace(":", "");
            a.protocol = browsers[browser][protocol];

            return a.href;

        },
        _notify: function(response)
        {
        	removePopup(this);
        }
    });

    zapp._init();

}).call(this);

zapp.paymentType = {
    "instant": 0,
    "billpay": 1,
    "smb": 2
};

zapp.checkoutType = {
    "normal": 0,
    "quick": 1
};

zapp.deliveryType = {
    "address": 0,
    "collect": 1,
    "digital": 2,
    "f2f": 3,
    "service": 4
};