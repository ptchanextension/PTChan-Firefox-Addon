/*
 * This project was built using the spaghetti code paradigm
 * with help of the ImInAHurrySoScrewIt framework.
 */

$(document).ready(function()
{
    handleExistingWebms();
    handleWebmPost();
});

/*
 * Searches for posts that have WebM videos uploded with this extension
 * then changes de DOM accordingly.
 */
function handleExistingWebms()
{
    //Get all posts that contain the [webm] tag
    var webms = $("span.filesize:contains(webm_)");
    
    //Iterate through them
    for(i=0; i<webms.length; i++)
    {
        //Extract WebM URL
        var filesizeSpanText = $(webms[i]).text();
        var webmFileName = filesizeSpanText.substring(filesizeSpanText.indexOf("webm_")+5, filesizeSpanText.lastIndexOf(".png"));
        var webmURL = "http://s1.webmshare.com/"+webmFileName+".webm";
        
        //Get post's image link
        var webmPostLink  = $(webms[i]).next().next();
        //Get post's filename link
        var webmPostFilenameImageLink = webmPostLink.prev().prev().find("a");
        
        //Change the post's image to the correct preview
        webmPostLink.find("img").attr("src", "http://s1.webmshare.com/t/"+webmFileName+".jpg");
        //Change the post's image link to the WebM URL
        webmPostLink.attr("href", webmURL);
        //Change the filename link contents to the WebM URL
        webmPostFilenameImageLink.html(webmURL);
        //Change the filename link href to the WebM URL
        webmPostFilenameImageLink.attr("href", webmURL);
        //Override the onclick handle for the filename link, to open the WebM in a new window
        $("<a target='_blank' href='"+webmURL+"'>"+webmURL+"</a>").insertAfter(webmPostFilenameImageLink.hide());
        //Remove the first line from the post (contains metadata for this extension, no longer needed)
        var blockquote = $($(webms[i]).siblings("blockquote")[0]).find("div");
        blockquote.html(blockquote.html().split("\n").slice(1).join("\n"));
    }
}

/*
 * Handles a WebM upload through PTChan's post form
 */
function handleWebmPost()
{
    //Override form submit behaviour
    $("#postform").submit(function(e)
    {        
        //Get the file input control
        var fileInput = $(this).find("input[name='imagefile']")[0];
        //If there's no file
        if(typeof fileInput === "undefined" || fileInput.files.length === 0)
        {
            //Continue normally
            return true;
        }
    
        //Get the file to upload
        var webmFile = fileInput.files[0];
        //If it's a WebM file
        if(webmFile.name.substr(-4) === "webm")
        {
            //Disable submit button to prevent multiple submitions
            $(this).find("input[type='submit']").attr("disabled", "disabled");

            //Prevent PTChan's form from POSTing normally while we're doing all this stuff
            e.preventDefault();
            
            //Construct a form according to webmshare.com's upload form
            var formData = new FormData();
            //Append WebM file
            formData.append("file", webmFile);
            //Append a caption
            formData.append("caption", "");
            
            //Add a progress bar to PTChan's post form
            $(fileInput).parent().append('<progress id="webmprogress" max="100" value="0"></progress>');

            //Upload WebM to webmshare.com through AJAX
            $.ajax(
            {
                url: "http://webmshare.com/upload",
                type: "POST",
                data: formData,
                cache: false,
                processData: false,
                contentType: false,
                xhr: function()
                {
                    /*
                     * Modify the default xhr object to update the progress of the upload
                     */
                    var myXhr = $.ajaxSettings.xhr();
                    myXhr.upload.addEventListener("progress", function(event)
                    {
                        $("#webmprogress").attr("value", Math.ceil((event.loaded/event.total)*100));
                    }, false);
                
                    return myXhr;
                },
                success: function(data)
                {
                    /*
                     * Upload successfull
                     */
                    
                    //Construct an HTML document from webmshare.com result data
                    var resultDocument = $(data);
                    //Extract WebM URL
                    var directPlayURL = resultDocument.find("video source").attr("src");
                    //Extract Thumbnail URL
                    var thumbnailURL = $($(resultDocument.find(".form-control")[2]).text()).find("img").attr("src");
                    
                    /*
                     * Prepare to make the PTChan post
                     */
                    //Clear the file from PTChan's post form
                    $("#postform input[type='file']")[0].value = "";
                    //Add metadata to post's header
                    $("#postform textarea")[0].value = directPlayURL+"\n"+$("#postform textarea")[0].value;
                    //Construct a form according to PTChan's post form
                    var ptChanFormData = new FormData($("#postform")[0]);
                    
                    //Info image
                    var b64InfoImage = "data:image/png;base64,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";
                    var infoImageFilename = "webm_"+directPlayURL.substring(directPlayURL.lastIndexOf("/")+1, directPlayURL.lastIndexOf("."))+".png";
                    ptChanFormData.append("imagefile", window.dataURLtoBlob(b64InfoImage), infoImageFilename);

                    //Original XMLHttpRequest holder
                    var originalXhr;
                    //Proceed to make a post to PTChan using AJAX
                    $.ajax(
                    {
                        url: "http://www.ptchan.net/board.php",
                        type: "POST",
                        data: ptChanFormData,
                        cache: false,
                        processData: false,
                        contentType: false,
                        xhr: function()
                        {
                            /*
                             * Save the default XMLHttpRequest object
                             */
                            originalXhr = $.ajaxSettings.xhr();
                            return originalXhr;
                        },
                        success: function(data)
                        {
                            //Remove progress bar (this shouldn't be needed, but just in case)
                            $("#webmprogress").remove();

                            //Post successful, redirect to destination
                            var destination = window.location.href;
                            //(This is a very recent attribute, so we test it)
                            if(typeof originalXhr.responseURL !== "undefined")
                            {
                                //(If we reach here we can handle noko)
                                destination = originalXhr.responseURL;
                            }
                            window.location = destination;
                        },
                        error: function(jqxhr, textStatus, errorThrown)
                        {
                            //Remove progress bar
                            $("#webmprogress").remove();
                        }
                    });
                },
                error: function(data)
                {
                    //Remove progress bar
                    $("#webmprogress").remove();
                }
            });
        }
    });
}