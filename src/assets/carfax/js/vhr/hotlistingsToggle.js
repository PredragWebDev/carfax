function reloadInventoryManagerFrame() {
	try {
      	var x = self.opener.parent.frames[0].document.getElementById('inventoryManagerLink').href;
      	self.opener.parent.frames[1].location.href=x;
 	}catch(err) { }
}

var UpdateMessages = {
	ADDED:'This vehicle has been added to your online listings!',
	REMOVED:'This vehicle has been removed from your online listings!'
};

function displayUpdateMessage(msg){
	$('#icr-updated-message').text(msg).fadeIn('slow').css('visibility', 'visible');
	var fadeOutCallback = function(){
		$(this).css({display:'inline', visibility:'hidden'});
	};
	var timedMethodCall = function(){
		$('#icr-updated-message').fadeOut('slow', fadeOutCallback);
	};
	setTimeout(timedMethodCall, 3000);
}

function switchInventoryStatus(vin, status) {
	$('#toggleIndicator').css('visibility', 'visible');
	var inventory = {listing: {online: status}};
	
	updateOnlineStatus(vin, {
		success: function(data) {
			reloadInventoryManagerFrame();
			$('#toggleIndicator').css('visibility', 'hidden');

			var msg = (status)?UpdateMessages.ADDED : UpdateMessages.REMOVED;
			displayUpdateMessage(msg);
		},
		data: inventory
	});	
}

function meta(name){
	var value = $('meta[name="'+name+'"]').attr('content');
	return (value) ? value : "";
}

function icrToggleOnClick(e) {
	var status;
	status = $('#onlineListingsToggle').is(':checked');
	switchInventoryStatus(meta('subscriberVin'), status);
}

function toggleButtonSetup() {
	$('#onlineListingsToggle').change(icrToggleOnClick);
	$('.toggle-def').mouseover(function(){
		showtip(this, 'defOnlineListingsToggle');
	}).mouseout(function(){
		hidetip('defOnlineListingsToggle')
	});
}

$(DocumentHelper.getDocument()).ready(toggleButtonSetup);