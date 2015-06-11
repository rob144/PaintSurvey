$(document).ready(function(){

    makeComponents(['.loadingDivOuter']);

    $('.btn-delete-data').click(function(){
        doXhr({
            httpMethod: 'POST',
            url: '/deletedata',
            successFunc:  function(data, status){
                if(status == 'success'){
                  alert('Data deleted.');
                }else{
                  alert('Error.');
                }
            }
        });
    });

    $('.btn-init-data').click(function(){
        doXhr({
            httpMethod: 'POST',
            url: '/initdata',
            successFunc:  function(data, status){
                if(status == 'success'){
                  alert('Data initialized');
                }else{
                  alert('Error.');
                }
            }
        });
    });

});