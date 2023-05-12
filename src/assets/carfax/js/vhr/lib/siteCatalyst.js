function printPageTracking(){
	if(typeof s_gi == 'function') {
		var s=s_gi('carfaxcom');
		s.linkTrackVars='events';
		s.linkTrackEvents='event18';
		s.events='event18';
		s.tl(this,'o','Print Report');
	}
}

function greenButtonTracking(){
	if(typeof s_gi == 'function') {
		var s=s_gi('carfaxcom');
		s.linkTrackVars='events';
		s.linkTrackEvents='event41';
		s.events='event41';
		s.tl(this,'o','BubbleUpVHRClick');
	}
}