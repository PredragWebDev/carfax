function clearField(textFieldId) {
    document.getElementById(textFieldId).value = "";
}

function jumpLink(toWhere) {
    window.location.hash = toWhere;
}

(function setupTooltips() {
    function toggle(id, remove, add) {
        if (id) {
            var tooltip = $("#" + id);
            tooltip.removeClass(remove);
            tooltip.addClass(add);
        }
    }

    function highlightRow(rowId) {
        toggle(rowId, "XDinactive", "XDactive");
    }

    function unhighlightRow(rowId) {
        toggle(rowId, "XDactive", "XDinactive");
    }

    function bindTooltips() {
        $('a[rel="tooltip"]').each(function bindTooltip() {
            var width = this.id == 'linkInstalledDetails' ? 'auto' : 400;

            var href = $(this).attr('href');
            if (href.length && href[0] !== '#') {
                var element = $('#' + href);
                if (element) {
                    var text = element.html();

                    $(this).qtip({
                        style: {
                            classes: 'tool-qtip',
                            width: width,
                            tip: {
                                corner: 'top left',
                                mimic: 'center',
                                offset: 10,
                                border: 1,
                                width: 20,
                                height: 10
                            }
                        },
                        position: {
                            my: 'top left',  // Position my top left...
                            at: 'bottom center', // at the bottom right of...
                            target: $(this),
                            adjust: {
                                x: -10,
                                y: 5
                            }
                        },
                        // offset: -30,
                        content: text,
                        show: 'mouseover',
                        // hide: 'click'
                        hide: {when: 'mouseout', effect: 'fade'}
                    }).click(function tooltipClick() {
                        return false;
                    });
                }
            }
        });
    }

    $(DocumentHelper.getDocument()).ready(function onDocumentReady() {
        $('#runReportTbh_vinId').select();
        var inactive = $(".XDinactive");
        inactive.mouseover(function activateTooltip() {
            highlightRow(this.id)
        });
        inactive.mouseout(function deactivateTooltip() {
            unhighlightRow(this.id)
        });
        bindTooltips();
    });
})();

function detailIconWindowCheck() {
    if($(window).width() < 800) {
        $(".detail-icon-with-date").addClass("detail-icon-show");
        $(".detail-icon-with-date").removeClass("detail-icon-hide");
        $(".detail-icon-column").addClass("detail-icon-hide");
        $(".detail-icon-column").removeClass("detail-icon-show");
    } else {
        $(".detail-icon-with-date").addClass("detail-icon-hide");
        $(".detail-icon-with-date").removeClass("detail-icon-show");
        $(".detail-icon-column").addClass("detail-icon-show");
        $(".detail-icon-column").removeClass("detail-icon-hide");
    }
}

$(document).ready(function() {
    function addToUrl(self, dataKey) {
        if ($(self).attr('data-' + dataKey.toLowerCase()) != undefined) {
            return '&' + dataKey + '=' + $(self).attr('data-' + dataKey.toLowerCase());
        }

        return "";
    }

    $('a.detailLineUrl').click(function serviceLinkClick(event) {
        var url = $(this).attr('data-webdomain') + 'phoenix/followDetailsLink.cfx?';
        url += addToUrl(this, 'vin') +
            addToUrl(this, 'rptDate') +
            addToUrl(this, 'permutationName') +
            addToUrl(this, 'key') +
            addToUrl(this, 'compCode') +
            addToUrl(this, 'slc') +
            addToUrl(this, 'tranDate') +
            addToUrl(this, 'ownerNumber') +
            addToUrl(this, 'reportCategory') +
            addToUrl(this, 'recordNumber');

        url += (url.indexOf('&') != -1 ? '&' : '') + 'linkUrl=' + $(this).attr('href');
        $.get(encodeURI(url), function(result) { console.log(result) });
    });
    detailIconWindowCheck();
    $(window).on('resize', function() {
        detailIconWindowCheck();
    });
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
