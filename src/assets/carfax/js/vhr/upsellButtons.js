$(DocumentHelper.getDocument()).ready(function() {
    nmvtisButtonSetup();
    canadaLienButtonSetup();

    $('#runLienReportBtn').click(function() {
        displayPending();
    });
});

function nmvtisButtonSetup() {
	if(setDisplayBasedOnPreviousNmvtisPurchase) {
		if($('#nmvtisResultsBtn').length > 0) {
			setDisplayBasedOnPreviousNmvtisPurchase(meta('subscriberVin'), function(nmvtisCheck){
				$('#nmvtisResultsBtn').text(nmvtisCheck.id == 0 ? 'Run' : 'View');
			});
		}
	}
}

function canadaLienButtonSetup() {
    if(setDisplayBasedOnLienReportInventory) {
        if($('#runLienReportBtn').length > 0) {
            setDisplayBasedOnLienReportInventory(meta('subscriberVin'), function(data){
                if (data.vinStatuses[0].status === 'COMPLETE') {
                    displayComplete(data.vinStatuses[0].reportUrl);
                } else if(data.vinStatuses[0].status === 'PENDING') {
                    displayPending();
                }
            });
        }
    }
}

function displayComplete(url) {
    var language = $('#vhrLienButtons').data('language');
    var buyUpdateText = 'Buy Update';
    if(language.toLowerCase() == 'fr_ca') {buyUpdateText = 'Acheter la mise à jour'}
    $('#runLienReportBtn').text(buyUpdateText);
    $('#viewLienReportBtn').attr('href', url)
    $('#viewLienReportBtn').show();
}

function displayPending() {
    $('#vhrLienButtons').hide();
    $('#vhrLienPending').css('display', 'inline-block')
}