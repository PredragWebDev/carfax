function dealerLinkTracking(linkElement, actionCode, vin, dealerId, zip, dealerUrl, omnitureInformation) {
    makePostRequestTo(beaconTrackingPostUrl(actionCode), beaconTrackingPostBody(actionCode, vin, dealerId, zip, dealerUrl));
    omnitureTracking(linkElement, 'event48', omnitureInformation);
}

function beaconTracking(actionCode, vin, dealerId) {
    makePostRequestTo(beaconTrackingPostUrl(actionCode), beaconTrackingPostBody(actionCode, vin, dealerId, '', ''));
}

function beaconTrackingPostUrl(actionCode) {
    return "/api/ubs/" + actionCode;
}

function beaconTrackingPostBody(actionCode, vin, dealerId, zip, dealerUrl) {
    var map = {"vin": vin, "action": actionCode,"typeOfResult":"ENHANCED", "vehicleZip":zip, "dealerUrl":dealerUrl, "dealerId":dealerId, "uid":getBeaconTrackingUid()};
    return JSON.stringify(map);
}

function makePostRequestTo(url, postBody) {
    var xmlHttp = window.XDomainRequest ? new window.XDomainRequest() : new XMLHttpRequest();
    xmlHttp.open('POST', url, true);
    xmlHttp.setRequestHeader('Content-type', 'application/json');
    xmlHttp.send(postBody);
}

function getBeaconTrackingUid() {
    var uid = readCookie("uuid");
    return uid ? uid : '';
}

function readCookie(k, r) {
    return (r = RegExp('(^|; )' + k + '=([^;]*)').exec(document.cookie)) ? r[2] : null;
}

function omnitureTracking(linkElement, trackEvents, omnitureInformation) {
    var s = s_gi('carfaxcom');
    s.linkTrackVars = 'events';
    s.linkTrackEvents = trackEvents;
    s.events = trackEvents;
    s.tl(linkElement, 'o', omnitureInformation);
}
