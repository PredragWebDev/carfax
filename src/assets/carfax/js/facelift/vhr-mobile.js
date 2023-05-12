$(document).ready(function() {


    if($('#value-container').length) {
        $('h1:first-of-type').addClass('no-value-header');
    }

    $(window).scroll(function(){
        if($(document).scrollTop() > 0) {
            $("body").addClass("scrolled");
        } else {
            $("body").removeClass("scrolled");
        }
    })


});