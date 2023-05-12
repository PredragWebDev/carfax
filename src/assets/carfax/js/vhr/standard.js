
function SetCookie (name,value,expires,path,domain,secure){
  document.cookie = name + "=" + escape (value) + ((expires) ? "; expires=" + expires.toGMTString() : "") + ((path) ? "; path=" + path : "") + ((domain) ? "; domain=" + domain : "") + ((secure) ? "; secure" : "");
}
function getCookieVal (offset){
  var endstr = document.cookie.indexOf (";", offset);
  if (endstr == -1)
	endstr = document.cookie.length;
  return unescape(document.cookie.substring(offset, endstr));
}
function GetCookie (name){
  var arg = name + "=";
  var alen = arg.length;
  var clen = document.cookie.length;
  
  if((document.cookie == null) || (document.cookie.length == null)){
  return null;
  }
  var i = 0;
  while (i < clen){
	var j = i + alen;
	if (document.cookie.substring(i, j) == arg)
	  return getCookieVal (j);
	i = document.cookie.indexOf(" ", i) + 1;
	if (i == 0) break;
  }
  
  return null;
}
  function NewWindow(mypage, myname, w, h, scroll) {
    var winl = (screen.width - w) / 2;
    var wint = (screen.height - h) / 2;
    // convert all characters to lowercase to simplify testing
    var agt = navigator.userAgent.toLowerCase();
    // Browser info again
    var is_major = parseInt(navigator.appVersion);
    var is_minor = parseFloat(navigator.appVersion);
    // Get browser version, if Netscape
    var is_nav  = ((agt.indexOf('mozilla')!=-1) && (agt.indexOf('spoofer')==-1)
                && (agt.indexOf('compatible') == -1) && (agt.indexOf('opera')==-1)
                && (agt.indexOf('webtv')==-1) && (agt.indexOf('hotjava')==-1));
    var is_nav2 = (is_nav && (is_major == 2));
    var is_nav3 = (is_nav && (is_major == 3));
    var is_nav4 = (is_nav && (is_major == 4));

    if (is_nav3 || is_nav2 || is_nav4) {
      WindowOpts = "height=" + h + ",width=" + w + ",top=" + wint + ",left=" + winl + ",scrollbars=yes,resizable=yes";
    } else {
      WindowOpts = "height=" + h + ",width=" + w + ",top=" + wint + ",left=" + winl + ",scrollbars=" + scroll + ",resizable=yes";
    }
    WindowResults = window.open(mypage, myname, WindowOpts);
    if(parseInt(navigator.appVersion) >= 4) {
      WindowResults.window.focus();
    }
  }
  
  function NewWindowCloseOld(mypage,myname,w,h,scroll){
    NewWindow(mypage,myname,w,h,scroll);
    window.close();
  }
  
function palmsampleWindow(partner, fid) {
    psampleWindow=window.open('/vehicle_history/report_tour_vhr.cfm?partner='+partner+'&FID='+fid,'psampleWin','width=695,height=600,scrollbars=yes');
}		
 
function sampleWindowOpt2() {
	sampleWindowOpt2=window.open('/vehicle_history/opt2.cfm','sampleWinOpt2','width=695,height=600,scrollbars=yes');
}

function sampleWindowClean1() {
 psampleWindow=window.open('/cfm/sample_clean1.cfm','psampleWin','width=695,height=600,scrollbars=yes');
}

function popUpWhatIsAVin() {
    var ww = window.open("/cfm/popVIN.cfm","VIN","width=500,height=355");
    ww.focus();
}
function popUpTrademarkInfo() {
    var ww = window.open("/cfm/trademark_info.cfm","TI","width=640,height=355");
    ww.focus();
}

function openTarget(url){
	window.open(url);
}