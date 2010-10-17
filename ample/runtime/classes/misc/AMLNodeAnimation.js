/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2009 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */

var aAMLNodeAnimation_effects	= [],
	nAMLNodeAnimation_timeout	= 0,
	nAMLNodeAnimation_counter	= 0,
	oAMLNodeAnimation_easing	= {},
	oAMLNodeAnimation_durations	= {};			// Variables
oAMLNodeAnimation_durations["fast"]		= 200;
oAMLNodeAnimation_durations["normal"]	= 400;
oAMLNodeAnimation_durations["slow"]		= 600;

function fAMLNodeAnimation_play(oElement, oProperties, vDuration, vType, fHandler, sPseudo) {
	var oElementDOM	= oElement.$getContainer(sPseudo);
	if (!oElementDOM)
		return;
	// initialize effect
	var oEffect	= {},
		oComputedStyle	= fBrowser_getComputedStyle(oElementDOM);
	oEffect._element	= oElement;
	oEffect._container	= oElementDOM;
	oEffect._duration	= fIsNaN(vDuration) ? oAMLNodeAnimation_durations[vDuration] || oAMLNodeAnimation_durations["normal"] : vDuration;
	oEffect._callback	= fHandler;
	oEffect._type		= vType || '';
	oEffect._start		= new cDate;
	oEffect._data		= {};
	oEffect._identifier	= nAMLNodeAnimation_counter++;

	// read end params from input
	var sName;
	for (var sKey in oProperties)
		if (oProperties.hasOwnProperty(sKey)) {
			if (sKey == "scrollTop" || sKey == "scrollLeft")
				oEffect._data[sKey]	= [[oElementDOM[sKey]], [oProperties[sKey]]];
			else
				oEffect._data[sName = fUtilities_toCssPropertyName(sKey)]	= [fAMLNodeAnimation_parseValue(fBrowser_adjustStyleValue(oElementDOM, sName, fBrowser_getStyle(oElementDOM, sName, oComputedStyle))), fAMLNodeAnimation_parseValue(fBrowser_adjustStyleValue(oElementDOM, sName, '' + oProperties[sKey]))];
		}

	// delete running effects on new effect properties for the same element
	for (var nIndex = 0, oEffectOld; oEffectOld = aAMLNodeAnimation_effects[nIndex]; nIndex++)
		if (oEffectOld._container == oElementDOM)
			for (var sKey in oEffectOld._data)
				if (oEffectOld._data.hasOwnProperty(sKey) && oEffect._data[sKey])
					delete oEffectOld._data[sKey];

	var oEventEffectStart	= new cAMLEvent;
	oEventEffectStart.initEvent("effectstart", false, false);
	fAMLNode_dispatchEvent(oElement, oEventEffectStart);

	if (!nAMLNodeAnimation_timeout)
		nAMLNodeAnimation_timeout	= fSetTimeout(nAMLNodeAnimation_onTimeout, 20);

	aAMLNodeAnimation_effects.push(oEffect);

	// return effect resource identificator
	return oEffect._identifier;
};

function fAMLNodeAnimation_stop(nEffect) {
	// Find effect
	for (var nIndex = 0, oEffect; oEffect = aAMLNodeAnimation_effects[nIndex]; nIndex++)
		if (oEffect._identifier == nEffect)
			break;

	if (!oEffect)
		return;

	var oData,
		aValue;
	for (var sKey in oEffect._data)
		if (oEffect._data.hasOwnProperty(sKey)) {
			oData	= oEffect._data[sKey];
			aValue	= oData[1];
			if (sKey == "scrollTop" || sKey == "scrollLeft")
				oEffect._container[sKey]	= aValue[0];
			else {
				// Color value
				if (aValue && aValue[1] == '#')
					aValue	= fAMLNodeAnimation_toHex(aValue[0]);
				else
				if (sKey == "backgroundPosition")
					aValue	= [aValue[0][0], aValue[1], ' ', aValue[0][1], aValue[1]];
				//
				fBrowser_setStyle(oEffect._container, sKey, aValue.join(''));
			}
		}

	var oEventEffectEnd	= new cAMLEvent;
	oEventEffectEnd.initEvent("effectend", false, false);
	fAMLNode_dispatchEvent(oEffect._element, oEventEffectEnd);

	// clear effect
	fAMLNodeAnimation_remove(nEffect);
};

function nAMLNodeAnimation_onTimeout() {
	for (var nIndex = 0, oEffect, nTimestamp = new cDate; oEffect = aAMLNodeAnimation_effects[nIndex]; nIndex++) {
		// clear effect if node was removed
		if (!oAMLDocument_all[oEffect._element.uniqueID]) {
			fAMLNodeAnimation_remove(oEffect._identifier);
			nIndex--;
		}
		else {
			// stop effect if the time is up
			if (oEffect._duration <= nTimestamp - oEffect._start) {
				fAMLNodeAnimation_stop(oEffect._identifier);
				nIndex--;
				if (oEffect._callback)
					oEffect._callback.call(oEffect._element);
			}
			else {
				oEffect._timestamp	= nTimestamp;
				fAMLNodeAnimation_process(oEffect);
			}
		}
	}
	//
	nAMLNodeAnimation_timeout	= aAMLNodeAnimation_effects.length ? fSetTimeout(nAMLNodeAnimation_onTimeout, 20) : 0;
};

function fAMLNodeAnimation_process(oEffect) {
	// calculate current ratio
	var nDuration	= oEffect._duration,
		nRatio	= 0;
	if (nDuration) {
		var nRatioRaw	=(oEffect._timestamp - oEffect._start) / nDuration;
		if (oEffect._type instanceof cFunction)
			nRatio	= oEffect._type(nRatioRaw);
		else
		if (oEffect._type.indexOf("cubic-bezier") == 0) {
			// TODO
		}
		else {
			switch (oEffect._type) {
				case "linear":
					nRatio	= nRatioRaw;
					break;

				case "easein":
				case "ease-in":
					nRatio	= fAMLNodeAnimation_cubicBezier(nRatioRaw, 0.42, 0, 1, 1, nDuration);
					break;

				case "easeout":
				case "ease-out":
					nRatio	= fAMLNodeAnimation_cubicBezier(nRatioRaw, 0, 0, 0.58, 1.0, nDuration);
					break;

				case "easeinout":
				case "ease-in-out":
					nRatio	= fAMLNodeAnimation_cubicBezier(nRatioRaw, 0.42, 0, 0.58, 1.0, nDuration);
					break;

//				case "ease":
				default:
					nRatio	= fAMLNodeAnimation_cubicBezier(nRatioRaw, 0.25, 0.1, 0.25, 1.0, nDuration);
					break;
			}
		}
	}

	//
	var oData,
		aValue;
	for (var sKey in oEffect._data)
		if (oEffect._data.hasOwnProperty(sKey)) {
			oData	= oEffect._data[sKey];
			aValue	= fAMLNodeAnimation_sumValue(oData[0], fAMLNodeAnimation_mulValue(fAMLNodeAnimation_subValue(oData[1], oData[0]), nRatio));
			if (sKey == "scrollTop" || sKey == "scrollLeft")
				oEffect._container[sKey]	= aValue[0];
			else {
				// Color value
				if (aValue[1] == '#')
					aValue	= fAMLNodeAnimation_toHex(aValue[0]);
				else
				if (sKey == "backgroundPosition")
					aValue	= [aValue[0][0], aValue[1], ' ', aValue[0][1], aValue[1]];
				//
				fBrowser_setStyle(oEffect._container, sKey, aValue.join(''));
			}
		}
};

function fAMLNodeAnimation_remove(nEffect) {
	// delete effect
	for (var nIndex = 0, oEffect, bFound = false; oEffect = aAMLNodeAnimation_effects[nIndex]; nIndex++)
		if (bFound)
			aAMLNodeAnimation_effects[nIndex-1]	= oEffect;
		else
		if (oEffect._identifier == nEffect)
			bFound	= true;

	if (bFound)
		aAMLNodeAnimation_effects.length--;
};

// Utilities
function fAMLNodeAnimation_parseValue(sValue) {
	// TODO: Process rgba colors
	if (!sValue)
		return null;

	// trim spaces
	sValue	= sValue.trim();

	var aValue,
		nIndex,
		sValueLower = sValue.toLowerCase();

	// if standard color used
	if (sValueLower in hBrowser_cssColors)
		sValue	= hBrowser_cssColors[sValueLower];

	// #rgb or #rrggbb
	if (sValue == "transparent")
		return [[1, 1, 1], '#', ''];
	if (aValue = sValue.match(/^#([\da-f]{3})$/i))
		return [[fParseInt(aValue[1].substr(0, 1), 16) / 15, fParseInt(aValue[1].substr(1, 1), 16) / 15, fParseInt(aValue[1].substr(2, 1), 16) / 15], '#', ''];
	if (aValue = sValue.match(/^#([\da-f]{6})$/i))
		return [[fParseInt(aValue[1].substr(0, 2), 16) / 255, fParseInt(aValue[1].substr(2, 2), 16) / 255, fParseInt(aValue[1].substr(4, 2), 16) / 255], '#', ''];
	if (aValue = sValue.match(/^(\w+[\w\d]+)\((.+)\)$/)) {
		var sFunction	= aValue[1],
			sParameters	= aValue[2];
		if (aValue[1] == "rgb") {
			if (aValue = sParameters.match(/^(\d+),\s*(\d+),\s*(\d+)$/))
				return [[aValue[1] / 255, aValue[2] / 255, aValue[3] / 255], '#', ''];
			else
			if (aValue = sParameters.match(/^(\d+)%,\s*(\d+)%,\s*(\d+)%$/))
				return [[aValue[1] / 100, aValue[2] / 100, aValue[3] / 100], '#', ''];
		}
		else
		if (aValue[1] == "rgba") {
			if (aValue = sParameters.match(/^(\d+),\s*(\d+),\s*(\d+),\s*(\d+)$/))
				return [[aValue[4] == 0 ? 1 : aValue[1] / 255, aValue[4] == 0 ? 1 : aValue[2] / 255, aValue[4] == 0 ? 1 : aValue[3] / 255], '#', ''];
			else
			if (aValue = sParameters.match(/^(\d+)%,\s*(\d+)%,\s*(\d+)%,\s*(\d+)%$/))
				return [[aValue[4] == 0 ? 1 : aValue[1] / 100, aValue[4] == 0 ? 1 : aValue[2] / 100, aValue[4] == 0 ? 1 : aValue[3] / 100], '#', ''];
		}
		else {
			if (aValue = sParameters.split(/\s*,\s*/g)) {
				for (var nIndex = 0, oValue, oValueOut = [[], '', '']; nIndex < aValue.length; nIndex++)
					if (oValue = fAMLNodeAnimation_parseValue(aValue[nIndex]))
						oValueOut[0].push(oValue[0]);
				oValueOut[2]	= sFunction;
				if (oValueOut[0].length)
					return oValueOut;
			}
		}
	}
	// +-ValueUnit
	if (aValue = sValue.match(/^([+-]?\d*\.?\d+)(em|ex|px|in|cm|mm|pt|pc|%)?$/))
		return [cNumber(aValue[1]), aValue[2] || '', ''];
	// List of values
	if ((aValue = sValue.split(/\s*,\s*|\s+/)) && aValue.length > 1) {
		for (var nIndex = 0, oValue, oValueOut = [[], '', '']; nIndex < aValue.length; nIndex++) {
			if (oValue = fAMLNodeAnimation_parseValue(aValue[nIndex])) {
				oValueOut[0].push(oValue[0]);
				oValueOut[1]	= oValue[1];
			}
		}
		if (oValueOut[0].length)
			return oValueOut;
	}
	//
	return [sValue, '', ''];
};

function fAMLNodeAnimation_toHex(aValue) {
	return ['#', ('000000' + (aValue[2] * 255 | (aValue[1] * 255 << 8) | (aValue[0] * 255 << 16)).toString(16)).slice(-6)];
};

function fAMLNodeAnimation_sumValue(oValue1, oValue2) {
	if (oValue1[0] instanceof cArray) {
		for (var nIndex = 0, aValue = []; nIndex < oValue1[0].length; nIndex++)
			aValue.push(oValue1[0][nIndex] + oValue2[0][nIndex]);
		return [aValue, oValue1[1], oValue1[2]];
	}
	else
		return [oValue1[0] + oValue2[0], oValue1[1], oValue1[2]];
};

function fAMLNodeAnimation_subValue(oValue1, oValue2) {
	if (oValue1[0] instanceof cArray) {
		for (var nIndex = 0, aValue = []; nIndex < oValue1[0].length; nIndex++)
			aValue.push(oValue1[0][nIndex] - oValue2[0][nIndex]);
		return [aValue, oValue1[1], oValue1[2]];
	}
	else
		return [oValue1[0] - oValue2[0], oValue1[1], oValue1[2]];
};

function fAMLNodeAnimation_mulValue(oValue, nTimes) {
	if (oValue[0] instanceof cArray) {
		for (var nIndex = 0, aValue = []; nIndex < oValue[0].length; nIndex++)
			aValue.push(oValue[0][nIndex] * nTimes);
		return [aValue, oValue[1], oValue[2]];
	}
	else
		return [oValue[0] * nTimes, oValue[1], oValue[2]];
};

// UnitBezier.h, WebCore_animation_AnimationBase.cpp
function fAMLNodeAnimation_cubicBezier(t, a, b, c, d, nDuration) {
	var ax=0,bx=0,cx=0,ay=0,by=0,cy=0;
	// `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    function fSampleCurveX(t) {
    	return ((ax*t+bx)*t+cx)*t;
    };
    function fSampleCurveY(t) {
    	return ((ay*t+by)*t+cy)*t;
    };
    function fSampleCurveDerivativeX(t) {
    	return (3.0*ax*t+2.0*bx)*t+cx;
    };
	// The epsilon value to pass given that the animation is going to run over |dur| seconds. The longer the
	// animation, the more precision is needed in the timing function result to avoid ugly discontinuities.
	function fSolveEpsilon(nDuration) {
		return 1.0/(200.0*nDuration);
	};
    function fSolve(x,nEpsilon) {
    	return fSampleCurveY(fSolveCurveX(x,nEpsilon));
    };
	// Given an x value, find a parametric value it came from.
    function fSolveCurveX(x,nEpsilon) {
    	var t0,t1,t2,x2,d2,i;
		function fFabs(n) {
			return n >= 0 ? n : 0-n;
		}
        // First try a few iterations of Newton's method -- normally very fast.
        for (t2=x, i=0; i<8; i++) {
        	x2=fSampleCurveX(t2)-x;
        	if(fFabs(x2)<nEpsilon)
        		return t2;
        	d2=fSampleCurveDerivativeX(t2);
        	if (fFabs(d2) < 1e-6)
        		break;
        	t2=t2-x2/d2;
        }
        // Fall back to the bisection method for reliability.
        t0=0.0; t1=1.0; t2=x;
        if(t2<t0)
        	return t0;
        if(t2>t1)
        	return t1;
        while(t0<t1) {
        	x2=fSampleCurveX(t2);
        	if(fFabs(x2-x)<nEpsilon)
        		return t2;
        	if(x>x2)
        		t0=t2;
        	else
        		t1=t2;
        	t2=(t1-t0)*.5+t0;
        }
        return t2; // Failure.
    };
	// Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
	cx=3.0*a; bx=3.0*(c-a)-cx; ax=1.0-cx-bx; cy=3.0*b; by=3.0*(d-b)-cy; ay=1.0-cy-by;
	// Convert from input time to parametric value in curve, then from that to output time.
	return fSolve(t, fSolveEpsilon(nDuration));
};

// Extend AMLElement
cAMLElement.prototype.$animations	= null;