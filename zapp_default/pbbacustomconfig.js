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

/* 
 * This configuration file is used to define and override variables and functions for the Pay By Bank App Branded or Custom Web Merchant Button.
 * 
 * As a default implementation, this file contains the Branded Web Merchant Button implementation.
 * 
 * If you want to implement the custom web merchant button, then copy the contents of pbbacustomconfig_custom.template into this file.
 * 
 * If you want to implement the branded web merchant button, then copy the contents of pbbacustomconfig_branded.template into this file.
 * 
 */


/* Define the PBBA variables */

var zappVersion = "3.1.2"; // Current web merchant button library version.
var cookieManagementUrl = "https://paybybankappcookie.mastercard.co.uk/static/cookie-management/pbba-3550ce7763041531b9214e9e23986b37/" // Cookie management URL for PayConnect.
var merchantPollInterval = 5000; // Default merchant poll interval of 5 seconds to poll the merchant server for payment notification.
var cfiLogosURL= "https://paybybankappcdn.mastercard.co.uk/static/ml/pbba-3550ce7763041531b9214e9e23986b37/merchant-lib/banks.json"; // CDN location to fetch the CFI logos


/* Initialize PayConnect. */

window.onload = function() {
	setupPayConnect(cookieManagementUrl, document); 
	
}

/* Override the pay() and notify() functions.  */

zapp.load(zappVersion, {
	pay : function(data, callback) {

		/* 
		 * The only data that is required to be posted to the merchant server from the PBBA Web Merchant Button is the pcid.
		 * merchantRequestToPayPostData is the merchant's request to pay object that is posted to the merchant's server.
		 * 
		 */
		
		/*
		 *  The below merchantRequestToPayPostData is a JSON object defined by merchant to hold the checkout information 
		 *  and other things, in addition to all of merchants data element, they have to include the payConnectID element 
         *  to this object, a sample declaration is given below.
         *  
		 *  var merchantRequestToPayPostData  = {
		 *		payConnectID: null;
		 *  };
		*/
		
		if (typeof data.pcid !== "undefined")
			merchantRequestToPayPostData.payConnectID = data.pcid; //Merchant specific JSON object merchantRequestToPayPostData.payConnectID

		/* 
		 *	1.	Post the data to the merchant server.
		 *
		 *	2.	SUCCESSFUL RESPONSE - Upon receipt of a successful response from the merchant server:
		 * 		
		 *		A.	Create a response object by populating the following mandatory PBBA attributes:
		 *
		 *		NOTE: merchantRequestToPayResponseObject is assumed here to be the merchant's variable name of the JSON response object for the request to pay from the merchant server
		 */
		
		 			var response = new zapppopup.response.payment({
						success : true, // Leave it as is
						secureToken : merchantRequestToPayResponseObject.secureToken,
						brn : merchantRequestToPayResponseObject.pbbaCode,
						retrievalExpiryInterval : merchantRequestToPayResponseObject.retrievalTimeOutPeriod,
						confirmationExpiryInterval : merchantRequestToPayResponseObject.confirmationTimeoutPeriod,
						notificationSent: merchantRequestToPayResponseObject.cookieSentStatus,
						pcid: null, // Leave it as is
						cfiShortName: merchantRequestToPayResponseObject.bankName
					});
		     		
		     		
		/*
		 * 		B.	Make a callback passing in the response object created in Step A above:
		 */
		     		
		 			callback(response);
		 			
		/*
		 *	3.	ERROR - Upon receipt of an error from the merchant server:
		 *		
		 *		A.	Create a new response object by populating the following fields:
		 *
		 */
		 			
		 			var response = new zapppopup.response.payment({
						success : false, // Leave it as is
						data : MerchantErrorJSONObject // MerchantErrorJSONObject is assumed to be merchant naming for their error object
					});
		
		/*
		 *		B.	Make a callback passing in the response object created in Step A above:
		 */
		 			
		 			callback(response);
		 		
	},
	notify : function(secureToken, callback) {

		/*  NOTE: If jQuery.ajax is used for polling the merchant server and the method is GET then Zapp suggests doing the following to prevent caching:
		 * 
		 *  Step 1: Add the following property to AJAX call:
		 *  		cache: false
		 *  
		 *  Step 2: Add a cache busting parameter to the polling URL. This parameter can be any random number (for example, date timestamp) 
		 *  		appended to the polling URL. For example, if the polling URL is "/responseForPayment.aspx?secureToken=12345678&orderId=12345" then
		 *  		the URL with a cache busting parameter called time would be:  
		 *  		"/responseForPayment.aspx?secureToken=12345678&orderId=12345&time="+Date.now()
		 *  
		 */
		
		
		/*	1. 	This method polls the merchant server for a response every X seconds.
		 * 	  	X is the value for merchantPollInterval.
		 *
		 *	2.	secureToken must be passed to the merchant server to enable polling the zapp server for a 
		 *		payment notification.
		 *
		 *	3.	SUCCESSFUL RESPONSE - Upon receipt of a successful response from the merchant server:
		 *
		 *		A.	Create a new response object by populating the following fields:
		 *
		 */
		
					var response = new zapppopup.response.notify({
						success : true
					});
		
		/*
		 *		B.	Make a callback passing in the response object created in Step A above:
		 *
		 */
					
					callback(response);
					
		 
		/*		C.	Check if the pcid is present in the response from the merchant server. If present then
		 *			set the pcid cookie by calling the setCookie function:
		 *
		 *		NOTE: merchantGetPaymentStatusObject is the payment notification object returned from the merchant server
		 */
					
		 			setCookie("pcid", merchantGetPaymentStatusObject.payConnectID, merchantGetPaymentStatusObject.cookieExpiryDays, cookieManagementUrl);
		 			
		/*
		 *		D. Continue further order processing.
		 *
		 *	4.	IN PROGRESS - Upon receipt of an IN PROGRESS status from the distributor server:
		 *		
		 *		A.	Create a new response object by populating the following fields:
		 *
		 */
		 			var response = new zapppopup.response.notify({
						success : false
					});
		 			
		/*
		 *		B.	Make a callback passing in the response object created in Step A above:
		 *
		 */
		 			
		 			callback(response);
		 			
		/*
		 *	5.  ERROR - Upon receipt of an error from the merchant server:
		 *		
		 *		A.	Create a new response object by populating the following fields:
		 *
		 */
		 			
		 			var response = new zapppopup.response.notify({
						success : false
					});
		 			
		/*		B.	Make a callback passing in the response object created in Step A above:
		 *
		 */
		 			
		 			callback(response);
		 			
		/*
		 *		C.   Merchant implements their own Error Handling process
		 *
		 */
		 			
		 /* Example of a jQuery AJAX polling mechanism using method GET with caching set to false and a cache buster (time) in the URL.
		  * 
		  */ 
		  			
		  			jQuery.ajax({
							url : merchantPollingUrl, // Merchant URL to poll for the payment notification. Modify appropriately.
							dataType : "json", // If merchant expects a JSON object to be returned from the polled server. Modify appropriately.
							crossDomain : true, // If merchant requires cross domain polling. Modify appropriately.
							cache: false, // Disables caching in IE
							type : "GET", // In case the polling method is GET. Modify appropriately.
							contentType : "application/json; charset=UTF-8", // The content type to be posted to the polling server. Modify appropriately.
							success : function(merchantGetPaymentStatusObject) { // merchantGetPaymentStatusObject is the merchant's response object from the polled server
										
										var response = null;
										
										// Check for the response status from the polled server. If the status is in progress the continue polling using the following:
										
										response = new zapppopup.response.notify({success: false}); // Continue polling
										
										// Check for the response status from the polled server. If the status is success (indicating an authorised or a declined transaction) then do the following:
										
										response = new zapppopup.response.notify({success: true}); // Stop polling
										
										// If the PayConnect cookie is present in the response from the merchant server, then call the setCookie() function to
										// setup the PayConnect option.
										if (typeof merchantGetPaymentStatusObject.payConnectID != "undefined" ) {
											setCookie("pcid", merchantGetPaymentStatusObject.payConnectID, 
													merchantGetPaymentStatusObject.cookieExpiryDays, 
													cookieManagementUrl); 	// Set up PayConnect cookie, 
																			// merchantGetPaymentStatusObject.payConnectID being the payConnectId within the Merchant Response Object
										}
										
										callback(response); // Leave it as is
										
										// Continue further merchant specific processing. Example - showing the order success or cancel page.
							},
							error : function(merchantGetPaymentStatusObject) {
								// Error handling
								var response = new zapppopup.response.notify({success : false}); // Stop polling
								callback(response);
							}
					});
					
		 /* 
		  * 
		  */

	},
	error : function(errors) {
		/* Place any other error handling logic here */
	},
	cookieManagementUrl: cookieManagementUrl,
	merchantPollInterval: merchantPollInterval,
	cfiLogosURL: cfiLogosURL
});
