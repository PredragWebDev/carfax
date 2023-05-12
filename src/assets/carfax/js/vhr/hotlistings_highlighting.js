var isDHTML = 0;
var isID = 0;
var isAll = 0;
var isLayers = 0;
	if (document.getElementById) {
        isID = 1;
    } else if (document.all) {
    	isAll = 1;
    }
	function getObject(objectID) {
	    if (isID) {
	    	return (document.getElementById(objectID)) ;
	    } else if (isAll) {
	    	return (document.all[objectID]);
	    }  else {
	    	return null;
	    }
 	}
    function onHover(num) {
    	myRow = getObject('row'+num);
        if (myRow != null) {
        	myRow.style.background = "#ffffaa";
        }
    }
    function offHover(num) {
    	myRow = getObject('row'+num);
        if (myRow != null) {
        	myRow.style.background = "#ffffff";
        }
    }
    function onPremHover(num) {
    	myRow = getObject('row'+num);
    	if (myRow != null) {
    		myRow.style.background = "#ffffaa";
    	}
    }
    function offPremHover(num) {
    	myRow = getObject('row'+num);
    	if (myRow != null) {
    		myRow.style.background = "#ffffe6";
    	}
    }
