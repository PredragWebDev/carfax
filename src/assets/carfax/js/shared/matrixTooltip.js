function getScroll() {
   if (document.body.scrollTop != undefined) {	// IE model
      var ieBox = document.compatMode != "CSS1Compat";
      var cont = ieBox ? document.body : document.documentElement;
      return {x : cont.scrollLeft, y : cont.scrollTop};
   }
   else {
      return {x : window.pageXOffset, y : window.pageYOffset};
   }
}


function showtip(current, whichDiv)
{
		var scrollInfo = getScroll();
		elm = document.getElementById( whichDiv );
		elm.style.visibility = "visible";
		elm.style.top = findPosY(current,20) + "px";
		elm.style.left = findPosX(current,20)  + "px" ;
		window.status = '';
}

function hidetip(whichDiv){
	elm2 = document.getElementById( whichDiv );
    elm2.style.visibility="hidden";
}
function popWin(WindowURL,WindowName,WindowArg) {
    var WindowResults = window.open(WindowURL,WindowName,WindowArg);
}

/**
 * Adjusts the x position of a specified element in relation to
 * the midpoint of the page and is invoked in the onLoad and onResize
 * events of the window
 *
 * @param  whichElem  	div id of the element to be adjuusted
 * @param  horizTweak	integer x offset in pixels of the specified div
 * @return
 */
function resAdj(whichElem,horizTweak,verticalTweak){

   var tabWhichElem = whichElem;

   if(whichElem == 'wrn'){
      tabWhichElem = 'bbg';
   }

	if(!horizTweak){horizTweak = 0;}
	this.obj1 = document.getElementById(whichElem + 'Brand').style;
	yPosition = findPosY(tabWhichElem + "Tab1");
	xPosition = findPosX(tabWhichElem + "Tab1");

	this.obj1.top = yPosition + parseInt(verticalTweak) + 15;
	this.obj1.left = xPosition - parseInt(horizTweak);

	this.obj1.display = 'block';
	return this.obj1;
}

/**
 * Returns y position of the top left of the passed object
 *
 * @param	whichObj	id/name of the element to be referenced
 * @return	integer value of the y position of the top left of the specified element
 */
function findPosY(whichObj){
//	obj = document.getElementById(whichObj);
	obj = eval(whichObj);
	var t = 0;
	if (obj.offsetParent){
		while (obj.offsetParent){
			t += obj.offsetTop
			obj = obj.offsetParent;
		}
	}
	else if (obj.y)
		t += obj.y;
	return t ;
}

function findPosY(whichObj,offset){
//	obj = document.getElementById(whichObj);
	obj = eval(whichObj);
	var t = 0;
	if (obj.offsetParent){
		while (obj.offsetParent){
			t += obj.offsetTop
			obj = obj.offsetParent;
		}
	}
	else if (obj.y)
		t += obj.y;
	return t + offset ;
}

/**
 * Returns x position of the top left of the passed object
 *
 * @param	whichObj	id/name of the element to be referenced
 * @return	integer value of the x position of the top left of the specified element
 */
function findPosX(whichObj){
	obj = eval(whichObj);
	var t = 0;
	if (obj.offsetParent){
		while (obj.offsetParent){
			t += obj.offsetLeft
			obj = obj.offsetParent;
		}
	}
	else if (obj.x)
		t += obj.x;
	return t;
}

function findPosX(whichObj, offset){
	obj = eval(whichObj);
	var t = 0;
	if (obj.offsetParent){
		while (obj.offsetParent){
			t += obj.offsetLeft
			obj = obj.offsetParent;
		}
	}
	else if (obj.x)
		t += obj.x;
	return t + offset;
}



if(window.jQuery && window.DocumentHelper){
	$(DocumentHelper.getDocument()).ready(function(){
		$('a.vhr-tooltip').mouseover(function(){
			showtip(this, this.rel);
		}).mouseout(function(){
			hidetip(this.rel);
		}).click(function(){
			return false;
		});
	});
}