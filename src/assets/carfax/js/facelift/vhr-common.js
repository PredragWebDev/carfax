var globalModal = {
    globalModalBehavior: function(){
        $(".open-global-modal").on("click", function(event){
            event.preventDefault();
            var contentContainer = $(this).closest(".global-modal-container");
            contentContainer.globalModalId = $(this).data("global-modal");
            globalModal.openGlobalModal(contentContainer);
        });
        $("#global-modal").on("click", ".close-global-modal", function(event){
            if(!$(this).hasClass("external-link")) { // allow external links to open
                event.preventDefault();
            }
            globalModal.closeGlobalModal();
        });
        $(window).on('resize', function(){
            globalModal.closeGlobalModal();
        });
    },
    openGlobalModal: function(contentContainer){
        globalModal.moveModalContent(contentContainer);
        $("#global-modal .modal-content > *").show();
        $("#global-modal").show();
        globalModal.centerModalContent();
    },
    closeGlobalModal: function(){
        $("#global-modal .modal-content > *").hide();
        globalModal.uncenterModalContent(); /* fixes a perplexing bug related to centering the modal */
        globalModal.returnModalContent();
        $("#global-modal .modal-content").empty();
        $("#global-modal").hide();
    },
    moveModalContent: function(contentContainer){
        var modalContent = globalModal.identifyCorrectModalContent(contentContainer);
        var modalContentString = modalContent.wrap('<div/>').parent().html();
        modalContent.unwrap();
        modalContent.replaceWith("<div id='global-modal-placeholder' style='display:none;'></div>");
        $("#global-modal .modal-content").append(modalContentString);
    },
    returnModalContent: function(){
        var modalContent = $("#global-modal .modal-content > *").parent().html();
        $("#global-modal-placeholder").replaceWith(modalContent);
    },
    identifyCorrectModalContent: function(contentContainer) {
        if (contentContainer.globalModalId) {
            return $("#" + contentContainer.globalModalId);
        } else {
            return contentContainer.find(".global-modal-content");
        }
    },
    centerModalContent: function () {
        var modalContent = $("#global-modal .modal-content");
        modalContent.css("top", (($(window).height() - modalContent.outerHeight()) / 2) + "px");
        modalContent.css("left", (($(window).width() - modalContent.outerWidth()) / 2) + "px");
    },
    uncenterModalContent: function () {
        var modalContent = $("#global-modal .modal-content");
        modalContent.css("top", "0px");
        modalContent.css("left", "0px");
    }
    /* animate the modal */
}

var externalSiteModalBehavior = function(){
    $("a.external").click(function () {
        externalUrl = this.getAttribute("href");
        $("#interstitialMessagePartnerName").text(this.getAttribute("partnerName"));
        $("#external-site-warning .external-site-warning-content a").attr("href", externalUrl);
        return false;
    });
};

$(document).ready(function() {
    globalModal.globalModalBehavior();
    externalSiteModalBehavior();
});

//SMOOTH SCROLLING
$(function() {
    $("a[href^='#']").click(function() {
        var position = $($(this).attr("href")).offset().top - 85;
        $("body, html").animate({
            scrollTop: position
        }, 500)
        return false;
    });
});