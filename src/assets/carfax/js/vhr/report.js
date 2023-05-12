$(document).ready(function(){
	
	removeInlineOnclicks();
	
	// Both tags appear in some reports. Only one should be bound, otherwise a "double toggle" will happen.
  	if (idExists('#language-toggle')) {
  		
  	  	$('#language-toggle').click(function(){
  			window.location = rebuildUrlWithLanguageToggle(this.lang);
  	  	});
  	  	
  	} else {
  		
	  	$('#langToggle img').click(function(){
			window.location = rebuildUrlWithLanguageToggle(this.lang);
	  	});

  	}
});

function removeInlineOnclicks() {
	$('#language-toggle').attr('onclick', null);
	$('#langToggle img').attr('onclick', null);
}

function idExists(id) {
	return $(id).length > 0;
}

function rebuildUrlWithLanguageToggle(language) {

	var currentUrl = $(location).attr('href');

	if (language == 'es' || language == 'fr_ca' || language =='en_ca') {
        // Prepend params rather than append them to avoid problems with anchor tags that sometimes appear in the URL.
        currentUrl = currentUrl.replace(/language=(es|fr_ca|en_ca)&/,'');
        currentUrl = currentUrl.replace('?', '?language=' + language + '&');
    } else {
		currentUrl = currentUrl.replace(/language=(es|fr_ca|en_ca)&/,'');
	}
	
	if (currentUrl.match(/track=(true|false)/)) {
		currentUrl = currentUrl.replace(/track=(true|false)&?/,'')
	}

	// Prepend params rather than append them to avoid problems with anchor tags that sometimes appear in the URL.
	currentUrl = currentUrl.replace('?','?track=false&');
	
	return currentUrl;
}

function checkHotListingSetDisplay(vin, callback) {
	var url = contextRoot + '/hotlistingsDisplay/getInventory/' + vin;
	$.ajax(url, {
		success: callback
	});
}

function setDisplayBasedOnPreviousNmvtisPurchase(vin, callback) {
	var url = contextRoot + '/nmvtisDisplay/nmvtisCheck/' + vin
	$.ajax(url, {
		success: callback
	});
}

function setDisplayBasedOnLienReportInventory(vin, callback) {
    var data = {'vins':[vin]};
    $.ajax(contextRoot + '/api/canadaLien/reportStatus/', {
        type: 'POST',
        data: JSON.stringify(data),
        contentType: "application/json",
        success: callback
    });
}

var cfo = {
	getDataFromMetaTags: function() {
		var data = {   vin: meta('cfo:vin'),
				eventType: meta('cfo:eventType'),
				suggest: meta('cfo:suggest'),
				vinSuggest: meta('cfo:vinSuggest')
		};

		if(data.suggest == '') {
		   data.suggest = data.vinSuggest;
		}
		return data;
	},
	reloadWindow: function() {
		window.location.reload(true);
	},
	upgradeVhrToCip: function() {

		secure.ajaxWithAuth({
			'url': contextRoot + '/cip/upgrade/' + meta('subscriberVin'),
			'type':'POST',
			'contentType':'application/json',
			'successCallback': this.reloadWindow
			});
	},
    fromMetaTag: function(name){
        var value = $('meta[name="'+name+'"]').attr('content');
        return (value) ? value : "";
    }
};

function readUrlParam(name) {
	return (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1];
}

function updateOnlineStatus(vin, options) {
	secure.ajaxWithAuth({
		'url': contextRoot + '/hotlistingsDisplay/updateOnlineStatus/' + vin,
		'type':'POST',
		'data': JSON.stringify(options.data),
		'successCallback': options.success,
		'whenUserCancelsLogin': stopHotlistingsSpinner,
		'contentType': 'application/json'
	});
}

function stopHotlistingsSpinner() {
	$('#toggleIndicator').css('visibility','hidden');
}

var isDefined = function(property, object) {
	return typeof object[property] !== 'undefined';
}