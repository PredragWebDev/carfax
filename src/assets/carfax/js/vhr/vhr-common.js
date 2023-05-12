var globalModal = {
    globalModalBehavior: function(){
        $(".open-global-modal").on("click", function(event){
            event.preventDefault();
            var contentContainer = $(this).closest(".global-modal-container");
            contentContainer.globalModalId = $(this).data("global-modal");
            globalModal.openGlobalModal(contentContainer);
        });
        $("#global-modal").on("click", ".close-global-modal", function(event){
            event.preventDefault();
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
            return contentContainer.find("#" + contentContainer.globalModalId);
        } else {
            return contentContainer.find(".global-modal-content")
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

$(document).ready(function() {
    globalModal.globalModalBehavior();
});