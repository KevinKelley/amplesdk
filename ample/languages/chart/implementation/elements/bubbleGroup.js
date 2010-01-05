/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2009 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */

var cChartElement_bubbleGroup	= function(){};
cChartElement_bubbleGroup.prototype	= new cChartElement;
cChartElement_bubbleGroup.prototype.$hoverable	= true;

cChartElement_bubbleGroup.handlers	= {
	'DOMNodeInsertedIntoDocument':	function() {
		this.refresh();
	}
}

cChartElement_bubbleGroup.prototype.refresh	= function() {
	var aValue,
		aValues	= [],
		nXMin	= Infinity,
		nXMax	=-Infinity,
		nYMin	= Infinity,
		nYMax	=-Infinity,
		nZMin	= Infinity,
		nZMax	=-Infinity;
	// Pre-calculate ranges
	for (var nIndex = 0, oElement; oElement = this.childNodes[nIndex]; nIndex++) {
		aValue	= oElement.getAttribute("value").split(/,| /);
		aValues.push(aValue);
		if (aValue[0] * 1 < nXMin)
			nXMin	= aValue[0];
		if (aValue[0] * 1 > nXMax)
			nXMax	= aValue[0];
		if (aValue[1] * 1 < nYMin)
			nYMin	= aValue[1];
		if (aValue[1] * 1 > nYMax)
			nYMax	= aValue[1];
		if (aValue[2] * 1 < nZMin)
			nZMin	= aValue[2];
		if (aValue[2] * 1 > nZMax)
			nZMax	= aValue[2];
	}

	// Draw items
	var oElementDOM,
		nX, nY, nSize,
		d;
	for (var nIndex = 0, oElement; oElement = this.childNodes[nIndex]; nIndex++) {
		nX	= 50 + 500 * (nXMax - aValues[nIndex][0]) / (nXMax - nXMin);
		nY	= 250 - 200 * (nYMax - aValues[nIndex][1]) / (nYMax - nYMin);
		nSize	= 10 + 20 * aValues[nIndex][2] / (nZMax - nZMin);
		d	= "M" + (nX - nSize) + "," + nY +
			"a" + nSize + "," + nSize + " 0 0,0 " + nSize * 2 + ",0 " +
			"a" + nSize + "," + nSize + " 0 0,0 -" + nSize * 2 + ",0 " +
			"z";

		oElement.$getContainer("value").setAttribute("d", d);
		oElement.$getContainer("shadow").setAttribute("d", d);

		oElementDOM	= oElement.$getContainer("label");
		oElementDOM.setAttribute("x", 50 + 500 * (nXMax - aValues[nIndex][0]) / (nXMax - nXMin));
		oElementDOM.setAttribute("y", 250 - 200 * (nYMax - aValues[nIndex][1]) / (nYMax - nYMin) + 6);
	}
};

cChartElement_bubbleGroup.prototype.$getTagOpen	= function() {
	return '<svg:g class="c-bubbleGroup c-bubbleGroup_nth-child-' + this.parentNode.childNodes.$indexOf(this) +(this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '" style="' + this.getAttribute("style") + '" xmlns:svg="http://www.w3.org/2000/svg">\
				<svg:g>\
					<svg:path class="c-bubbleGroup--path" />\
					<svg:text class="c-bubbleGroup--label" x="100" y="100" style="stroke:none">' + this.getAttribute("label")+ '</svg:text>\
				</svg:g>\
				<svg:g class="c-bubbleGroup--gateway">';
};

cChartElement_bubbleGroup.prototype.$getTagClose	= function() {
	return '	</svg:g>\
			</svg:g>';
};

// Register Element with language
oChartNamespace.setElement("bubbleGroup", cChartElement_bubbleGroup);