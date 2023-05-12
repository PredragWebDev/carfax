secure = (function () {
	
	/* Methods attached to the '_public' object will be public. */
	var _public = {};
	
	/* Methods attached to the '_private' object will be private. */
	var _private = {};
	
	_public.ajaxWithAuth = function(params){
		
		jQuery.ajax({
				type: params.type ? params.type : 'GET',
				contentType: params.contentType ? params.contentType : 'application/x-www-form-urlencoded; charset=UTF-8',
				url: params.url, //this should be a url requiring authentication,
				data: params.data,
				async: false,
				success:function(data,textStatus){
					_private.hideLoginPrompt();
					params.successCallback(data);
				},
				error:function(XMLHttpRequest,textStatus,errorThrown){
					if (XMLHttpRequest.status == 401) { //401s returned by spring security when not authorized
	
						// will repeat this ajax request with same params after successful login
						_private.promptUserForCredentials(params);
					} else if(params.errorCallback){
						params.errorCallback();
					}
				}
			});
		
		return false;
	};
	
	_private.hideLoginPrompt = function() {
		$('div#ajaxModalFade').hide();
		$('div#ajaxLoginForm').hide();
		$('#ajaxLoginSpinner').hide();	
	};

	_private.promptUserForCredentials = function(params) {
		$('div#ajaxModalFade').fadeTo(0, 0.5);
		$('div#ajaxLoginForm').fadeIn('fast');	
				
		$('#ajaxLoginCloseButton').click(function() {
			_private.hideLoginPrompt();
			_private.executeOptionalResetCallback(params.whenUserCancelsLogin);		
		});
		
		$('#ajax-login').click(function() {
			$('#ajaxLoginForm').css('z-index', 9997);
			$('#ajaxLoginSpinner').show();
			_private.authenticate(params);
			return false;
		});
	};
	
	_private.executeOptionalResetCallback = function(callback) {
		if (typeof(callback) == "function") {
			callback();
		}
	};
	
	_private.displayInvalidLoginMessage = function(){
		$('#login-error-message').show();
		$('#ajaxLoginForm').css('z-index', 9999);
		$('#ajaxLoginSpinner').hide();	
	};
	
	_private.authenticate = function(params) {
		$.ajax({
			url : contextRoot + '/j_spring_security_check',
			type : 'post',
			data : {
				'j_username' : $('#ajax-username').val(),
				'j_password' : $('#ajax-password').val()
			},
			dataType : 'json',		
			success:function(data,textStatus,jqXHR){
				if(data.error){
					_private.displayInvalidLoginMessage();
				} else {
					_public.ajaxWithAuth(params);
				}
			}
		});
		return false;
	};
	
	return _public;

})();