(function(root, factory)
{
	///////////////////////////////////////////////////////////////
	// Module framework setup                                    //
	// https://github.com/umdjs/umd/blob/master/returnExports.js //
	///////////////////////////////////////////////////////////////

	if (typeof exports === 'object')
	{
		// Node. Does not work with strict CommonJS, but only 
		// CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory();
	}
	else if (typeof define === 'function' && define.amd)
	{
		// AMD. Register as an anonymous module.
		define(factory);
	}
	else
	{
		// Browser globals (root is window)
		root["saver"] = factory();
	}
}(this, function()
{

	/////////////////////////////
	// Implementation start... //
	/////////////////////////////

	var saver,
		downloadFunctions,
		iframe = null,
		anchor = null;


	//////////////////////
	// Helper functions //
	//////////////////////

	// Gets a reusable iframe element to assist in some of
	// the save types

	function getIframe()
	{
		if (iframe === null)
		{
			iframe = document.createElement("IFRAME");
			iframe.id = "saverFrame";
			iframe.height = 0;
			iframe.width = 0;
			iframe.style.display = "none";
			iframe.src = "about:blank";
		}
		return iframe;
	}

	function getIframeDocument()
	{
		var iframe = getIframe();

		// The iframe must be appended or
		// the content is null
		document.body.appendChild(iframe);

		var iframeContent = null;
		if (iframe.contentWindow)
		{
			iframeContent = iframe.contentWindow;
		}
		else if (iframe.contentDocument && iframe.contentDocument.document)
		{
			iframeContent = iframe.contentDocument.document;
		}
		else
		{
			iframeContent = iframe.contentDocument;
		}

		return iframeContent.document;
	}

	// Gets a reusable anchor element to assist in some of
	// the save types

	function getAnchorElement()
	{
		if (anchor === null)
		{
			anchor = document.createElement("a");
		}
		return anchor;
	}

	// Generates a plain text data URI for the given content

	function buildTextDataURI(textContent)
	{
		var encodedContent = encodeURI(textContent);
		return "data:charset=utf-8," + encodedContent;
	}

	function dispatchClickEvent(element)
	{
		// We need to use this to support Firefox. element.click only 
		// triggers downloads in Chrome, even though FF provides this
		// function.
		var fakeClick = document.createEvent("MouseEvents");
		fakeClick.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		element.dispatchEvent(fakeClick);
	}

	function isString(possibleString)
	{
		return Object.prototype.toString.call(possibleString) == '[object String]';
	}

	// If an invalid/empty filename is passed in, it generates a new unique name based
	// on the current timestamp. If the filename has any illegal characters in, these 
	// are stripped out.
	function sanitizeFilename(filename) {
		return isString(filename) && filename !== "" ? stripIllegalCharactersFromFilename(filename) : generateUniqueFilename();
	}

	function generateUniqueFilename()
	{
		// TODO implement
		return "notUnique";
	}

	function stripIllegalCharactersFromFilename(filename) {
		// TODO implement
		return filename;
	}

	function sanitizeContent(content) {
		return isString(content) ? content : Object.prototype.toString.call(content);
	}


	//////////////////////////////
	// Download implementations //
	//////////////////////////////

	/**
	 * Support for older IE browsers. Uses the magical
	 * execCommand("SaveAs") function to save a page with
	 * a specified filename. Only supports text though.
	 */

	function execCommandSaveAsIframe(content, filename)
	{
		var iframeDocument = getIframeDocument();
		iframeDocument.open();
		iframeDocument.write(content);
		iframeDocument.close();
		return iframeDocument.execCommand("SaveAs", null, filename);
	}

	/**
	 * Works with very recent browsers (Chrome 14+, FF20+).
	 * Uses an anchor tag with the "download" attribute to
	 * force the download of a data URI.
	 */

	function dataURIAnchorWithDownloadAttribute(content, filename)
	{
		var dataURI,
			anchorElement = getAnchorElement();

		function isSupported()
		{
			return typeof anchorElement.download != "undefined";
		}


		if (isSupported())
		{
			dataURI = buildTextDataURI(content);
			anchorElement.setAttribute("href", dataURI);
			anchorElement.setAttribute("download", filename);

			dispatchClickEvent(anchorElement);

			return true;
		}
		else
		{
			return false;
		}
	}

	/**
	 * Forces the download of a data URI in an iframe.
	 * Unfortunately you can't specify a filename this way.
	 */

	function dataURIWithIframe(content, filename)
	{
		var iframe,
			dataURI;

		function isSupported()
		{
			// TODO Detect support for data URIs
			return false;
		}

		if (isSupported())
		{
			iframe = getIframe();
			dataURI = buildTextDataURI(content);
			iframe.src = dataURI;
			return true;
		}
		else
		{
			return false;
		}
	}

	////////////////////
	// Core functions //
	////////////////////

	// The download functions to attempt using, in the order
	// they should be tried. If one fails or is not supported,
	// the next one in the array will be tried.
	downloadFunctions = [
		dataURIAnchorWithDownloadAttribute,
		dataURIWithIframe,
		execCommandSaveAsIframe
	];

	saver = {
		/**
		 * Creates a file with the given content and filename,
		 * and triggers the browsers Save As dialog to save the
		 * generated file.
		 *
		 * @param  {String} content  Textual content of the file
		 * @param  {String} filename The default filename for the file
		 */
		saveAs: function(content, filename)
		{
			var downloadSuccessful;

			filename = sanitizeFilename(filename);
			content = sanitizeContent(content);

			downloadSuccessful = false;
			for (var i = 0; i < downloadFunctions.length; ++i)
			{
				var downloadFunction = downloadFunctions[i];
				downloadSuccessful = downloadFunction(content, filename);
				if (downloadSuccessful)
				{
					break;
				}
			}

			// At this point we've either succeeded,
			// or we've run out of methods to try.
			if (!downloadSuccessful)
			{
				// TODO error
				alert("Couldn't download");
			}
		}
	};

	return saver;
}));