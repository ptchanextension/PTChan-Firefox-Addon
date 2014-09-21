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
    var webms = $("blockquote div:contains([webmdata])");
    
    //Iterate through them
    for(i=0; i<webms.length; i++)
    {
        //Get post text
        var webmPostContents = $(webms[i]).text();
        //Extract metadata from the post text
        var webmURL = window.atob(webmPostContents.substring(webmPostContents.indexOf("[webmdata]")+10,webmPostContents.indexOf("[/webmdata]")));
        //Get post's image link
        var webmPostLink  = $(webms[i]).parent().parent().find("> a > span > img.thumb").parent().parent();
        //Get post's filename link
        var webmPostFilenameImageLink = webmPostLink.prev().prev().find("a");
        
        //Change the post's image link to the WebM URL
        webmPostLink.attr("href", webmURL);
        //Change the filename link contents to the WebM URL
        webmPostFilenameImageLink.html(webmURL);
        //Change the filename link href to the WebM URL
        webmPostFilenameImageLink.attr("href", webmURL);
        //Override the onclick handle for the filename link, to open the WebM in a new window
        webmPostFilenameImageLink.attr("onclick", "window.open('"+webmURL+"'); return false;");
        //Remove the first line from the post (contains metadata for this extension, no longer needed)
        $(webms[i]).html($(webms[i]).html().split("\n").slice(1).join("\n"));
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
                    $("#postform textarea")[0].value = "[spoiler][webmdata]"+window.btoa(directPlayURL)+"[/webmdata] Para veres o vídeo instala a extensão: https://github.com/ptchanextension[/spoiler]\n"+$("#postform textarea")[0].value;
                    //Construct a form according to PTChan's post form
                    var ptChanFormData = new FormData($("#postform")[0]);
                    
                    /*
                     * We need the thumbnail image as a blob in order to be
                     * able to upload it to PTChan through the FormData object.
                     * For this we need to use XMLHttpRequest directly (no jQuery)
                     */
                    //Construct XMLHttpRequest object
                    var xhr = new XMLHttpRequest();
                    //Handler for when the request finishes
                    xhr.onreadystatechange = function()
                    {
                        //If all went well
                        if (this.readyState === 4 && this.status === 200)
                        {
                            //Add image blob to PTChan's form
                            ptChanFormData.append("imagefile", this.response, "thumbnail.jpg");
                            
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
                        }
                    };
                    //Make the AJAX request
                    xhr.open('GET', thumbnailURL);
                    xhr.responseType = 'blob';
                    xhr.send();
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