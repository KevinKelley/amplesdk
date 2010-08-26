/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2009 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */

var cSMILElement_animateTransform	= function(){};
cSMILElement_animateTransform.prototype	= new cSMILAnimationElement("animateTransform");

// Class Event Handlers
cSMILElement_animateTransform.handlers	= {};
cSMILElement_animateTransform.handlers["DOMNodeInsertedIntoDocument"]	= function(oEvent) {
	fSMILAnimationElement_init(this);
};

// Register Element
fAmple_extend(cSMILElement_animateTransform);
