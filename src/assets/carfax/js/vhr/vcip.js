
function changeTab(tabRel, tabId){
    $(".tabhover").removeClass('tabhover');
    tabRel = ($('#'+tabRel).length != 0)? tabRel : 'tabvhr';
    $('.tabactive').removeClass('tabactive');
    if($("#"+tabRel).attr("id") != $(".active").attr("id")){
        $(".active").fadeOut(300, function(){
            $(this).removeAttr("style");
            $(this).removeClass("active");
        });
        $("#"+tabId).addClass('tabactive');
        $("#"+tabRel).addClass("active").fadeIn(300, function() {
            $("#bottombracket").scrollTop(0);
        });
        loadPage(tabRel+"_url", tabRel, false);
    }
    window.scrollTo(0, 0);

    // tracking code
    trackTabChange(tabId);
}

function trackTabChange(tabId){
}

function loadPage(varName, tabName, pageLoadingForPrint) {
    var url = $("#" + varName).text();
    if (url !== "") {
        loadPageFromUrl(url, tabName, pageLoadingForPrint);
        $("#" + varName).text("");
    }
}

function loadPageFromUrl(url, tabName, pageLoadingForPrint) {
    if (pageLoadingForPrint) {
        printTiming.register(tabName);
    }
    $.ajax({type:"GET", url:url, dataType:"html", async:true,
        success:function (data) {
            try {
                data = data.replace("src=\"/phoenix/js/lib/jQuery.js\"", "");
                data = data.replace("src=\"http://my.carfax.com/phoenix/js/lib/jQuery.js\"", "");
                data = data.replace("src=\"http://dvlp.carfax.com/phoenix/js/lib/jQuery.js\"", "");
                data = data.replace("src=\"http://alpha.carfax.com/phoenix/js/lib/jQuery.js\"", "");
                data = data.replace("src=\"http://www.carfax.com/phoenix/js/lib/jQuery.js\"", "");

                data = data.replace("src=\"http://my.carfaxonline.com/phoenix/js/lib/jQuery.js\"", "");
                data = data.replace("src=\"http://dvlp.carfaxonline.com/phoenix/js/lib/jQuery.js\"", "");
                data = data.replace("src=\"http://alpha.carfaxonline.com/phoenix/js/lib/jQuery.js\"", "");
                data = data.replace("src=\"http://www.carfaxonline.com/phoenix/js/lib/jQuery.js\"", "");

                data = data.replace("src=\"http://my.carfax.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");
                data = data.replace("src=\"http://dvlp.carfax.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");
                data = data.replace("src=\"http://alpha.carfax.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");
                data = data.replace("src=\"http://www.carfax.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");

                data = data.replace("src=\"http://my.carfaxonline.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");
                data = data.replace("src=\"http://dvlp.carfaxonline.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");
                data = data.replace("src=\"http://alpha.carfaxonline.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");
                data = data.replace("src=\"http://www.carfaxonline.com/phoenix/js/lib/jquery-1.6.2.min.js\"", "");
                $("#" + tabName).html(data);
            }
            catch (e) {
//			alert(e);
            }},
        complete:function() {
            if (pageLoadingForPrint) {
                printTiming.done(tabName);
            }
        }
    });
}

function modalsVisible(){
    return ($('#printModal').css('display')==='block');
}

//printing
function getActiveTab() {
    return $("a[class='tabactive']");
}

function shouldPrintTab(tabId) {
    return  $("input[name='print_"+tabId+"']").prop("checked");
}

function arrangeTabsForPrinting() {
    $("span[class='ciptabs'] a[id^='tab']").each(function() {
        var divId = $(this).attr("tabname") || $(this).attr("rel");
        $("#" + divId).removeClass("printPage cipNoPrint");
        if (shouldPrintTab($(this).attr("id"))) {
            $("#"+divId).addClass("printPage");
        } else {
            $("#" + divId).addClass("cipNoPrint");
        }
    });

    arrangeChbvPrinting(shouldPrintTab("tab_vhr"));

    $("div.printPage:last").removeClass("printPage");
}

function arrangeChbvPrinting(shouldPrintVhr) {
    var valueContainer = $("#value-container");
    valueContainer.removeClass("printPage");
    if (shouldPrintVhr) {
        $("#reportBody > div").removeClass("cipNoPrint");
    }
    if (shouldPrintTab("chbv")) {
        if (!shouldPrintVhr) {
            $("#reportBody > div").addClass("cipNoPrint");
            $("#tabvhr").removeClass("cipNoPrint");
            valueContainer.addClass("printPage");
        }
        valueContainer.removeClass("cipNoPrint");
    } else {
        valueContainer.addClass("cipNoPrint");
    }
}

function bindPrintLink() {
    $(document).on('submit','#printForm',function(){
        if( $("input.repchk:checked").length === 0){
            $("#requirePrintSelectionAlert").css("display", "flex");
        } else{
            $("#requirePrintSelectionAlert").hide();
            printTiming.reset();
            arrangeTabsForPrinting();
            loadPageForPrintingIfChecked("wc");
            loadPageForPrintingIfChecked("bbg");
            printTiming.timeout();
            globalModal.closeGlobalModal();
        }
        return false;
    });
}

var printTiming = function() {
    var tabsLeft = '';
    var printed = false;
    function print() {
        if (!printed) {
            printed = true;
            window.focus();
            setTimeout(function () {
                window.print()
            }, 10);
        }
    }
    return {
        reset: function() {
            tabsLeft = '';
            printed = false;
        },
        register: function(tab) {
            tabsLeft += tab;
        },
        done: function (tab) {
            var images = document.getElementById(tab).querySelectorAll('img:not([src=""])');
            var loaded = 0;
            for (var i=0; i<images.length; i++) {
                images[i].addEventListener('load', function() {
                    loaded++;
                    if (loaded === images.length) {
                        tabsLeft = tabsLeft.replace(tab,'');
                        if (tabsLeft.length === 0) {
                            print();
                        }
                    }
                });
            }
        },
        timeout: function () {
            if (tabsLeft === '') {
                print();
            } else {
                setTimeout(function () {
                    print();
                }, 5000)
            }
        }
    }
}();

function loadPageForPrintingIfChecked(tab) {
    if($("input[name*='print_tab_" + tab + "']").is(':checked')){
        loadPage("tab" + tab + "_url", "tab" + tab, true);
    }
}

function CADexists(){
    return $(".cadinfo").length;
}

function coolLookingWindowCheck() {
    if($(window).height() < 680) {
        $("#bottombracket").addClass("scrollingTabs");
        $("#bottombracket").removeClass("fixedTabs");
    } else {
        $("#bottombracket").removeClass("scrollingTabs");
        $("#bottombracket").addClass("fixedTabs");
    }
}

function cipInit(){
    changeTab('tabvhr', 'tab_vhr');
    $("input[class='repchk']").prop("disabled", false);
    $("input.repchk").prop("checked", false);
    $("input[name='print_tab_vhr']").prop("checked", true);
    bindPrintLink();
    coolLookingWindowCheck();
    positionShareLinks();
}

//This function is safe to run even if #shareBtn is not on the page.
function positionShareLinks() {
    var btnOffset = $("#shareBtn").offset();

    if($("#shareMenu").length){
        $("#shareSpanner").css("left", btnOffset.left - 58).css("top", 47);
        $("#shareMenu").css("left",btnOffset.left - 58).css("top", 60);
    }
}

$(document).ready(function() {

    //Hides the print button on escape keyboard press
    $(document).keydown(function(e){
        var code = (e.keyCode ? e.keyCode : e.which);
        if(code === 27 && modalsVisible()){
            $("#printModal").hide();
        }
    });

    //The actual tab navigation
    $('body').on('mouseleave', '.ciptabs a:not(.tabactive)', function(){ $(this).removeClass('tabhover'); });
    $('body').on('mouseenter', '.ciptabs a:not(.tabactive)', function(){ $(this).addClass('tabhover'); });
    $('body').on('click', '.ciptabs a:not(.tabactive)', function(){
        changeTab($(this).attr("tabname") || $(this).attr("rel"), $(this).attr("id"));
        return false;
    });

    $('body').on('click', '.ciptabs a.tabactive', function(){
        return false;
    });

    //This cancels the URL from loading anything, and allows it to close the window, and then has the code to show/hide the print button
    $(".disabledBtn").click(function(e){
        e.preventDefault();
    });
    $('body').on('mouseenter mouseleave', '#cipPrintBtn', function(event){ $(this).toggleClass('printhover'); });

    $('body').on('mouseenter mouseleave', '#nonCipPrintBtn', function(event){ $(this).toggleClass('printhover'); });

    //Cancel printing
    $("#cancelPrint").click(function(){
        $("#printModal").fadeOut(function() {
            $("input[class='repchk']").prop("disabled", false);
            $("input.repchk").prop("checked", false);
            $("input[name='print_tab_vhr']").prop("checked", true);
            $(".printOption:eq(0)").addClass("printactive");
            $(".printOption:eq(1)").removeClass("printactive");
            $("#printError").hide();
        });
    });

    $(window).resize(function(){
        coolLookingWindowCheck();
        positionShareLinks();
    });

    cipInit();
    $("#checkAll").click(function(){
        $("input.repchk").prop("checked", true);
        return false;
    });

    $("#textRecalculateWarranty").click(function() { changeTab("tabwc", "tab_wc"); return false;});
    $("#textViewInfo").click(function() { changeTab("tabwc", "tab_wc"); return false;});

    $("#bbgLinkToTab").click(function() { changeTab("tabbbg", "tab_bbg"); return false;});
    $("#bbgImageLink").click(function() { changeTab("tabbbg", "tab_bbg"); return false;});
    $(".upgradeToCip").click(function () {
        try {
            if (cfo && cfo.upgradeVhrToCip) {
                cfo.upgradeVhrToCip();
            }
        }catch (e) {}
        return false;
    });
});
