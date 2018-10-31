$(document).ready(function () {

    var post_server = function (sSource, aoData, fnCallback, oSettings) {
        $.post('/order/query', JSON.stringify(aoData)).done(fnCallback);
    }


    // begin first table
    order_result = $('#order_result').dataTable({
        "sDom": "<'row'<'col-sm-6'l><'col-sm-6'f>r>t<'row'<'col-sm-6'i><'col-sm-6'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
            "sLengthMenu": "_MENU_ records per page",
            "oPaginate": {
                "sPrevious": "Prev",
                "sNext": "Next"
            }
        },
        "aoColumnDefs": [
            {
                'bSortable': false,
                'aTargets': [0]
            }
        ],
        "bServerSide": true,
        "sServerMethod": "POST",
        "sAjaxSource": "/order/query"
//        "fnServerData": post_server
    });


    jQuery('#order_result_wrapper .dataTables_filter input').addClass("form-control"); // modify table search input
    jQuery('#order_result_wrapper .dataTables_length select').addClass("form-control"); // modify table per page dropdown

});