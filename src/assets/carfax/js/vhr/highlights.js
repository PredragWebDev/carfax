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