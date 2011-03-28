{//-----------------------------------------------------------------------------
// 
// PURPOSE
// 
// Krona is a flexible tool for exploring the relative proportions of
// hierarchical data, such as metagenomic classifications, using a
// radial, space-filling display. It is implemented using HTML5 and
// JavaScript, allowing charts to be explored locally or served over the
// Internet, requiring only a current version of any major web
// browser. Krona charts can be created using an Excel template or from
// common bioinformatic formats using the provided conversion scripts.
// 
// 
// COPYRIGHT LICENSE
// 
// Copyright (c) 2011, Battelle National Biodefense Institute (BNBI);
// all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
// Adam Phillippy
// 
// This Software was prepared for the Department of Homeland Security
// (DHS) by the Battelle National Biodefense Institute, LLC (BNBI) as
// part of contract HSHQDC-07-C-00020 to manage and operate the National
// Biodefense Analysis and Countermeasures Center (NBACC), a Federally
// Funded Research and Development Center.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
// * Redistributions of source code must retain the above copyright
//   notice, this list of conditions and the following disclaimer.
// 
// * Redistributions in binary form must reproduce the above copyright
//   notice, this list of conditions and the following disclaimer in the
//   documentation and/or other materials provided with the distribution.
// 
// * Neither the name of the Battelle National Biodefense Institute nor
//   the names of its contributors may be used to endorse or promote
//   products derived from this software without specific prior written
//   permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// 
// 
// TRADEMARK LICENSE
// 
// KRONA(TM) is a trademark of the Department of Homeland Security, and use
// of the trademark is subject to the following conditions:
// 
// * Distribution of the unchanged, official code/software using the
//   KRONA(TM) mark is hereby permitted by the Department of Homeland
//   Security, provided that the software is distributed without charge
//   and modification.
// 
// * Distribution of altered source code/software using the KRONA(TM) mark
//   is not permitted unless written permission has been granted by the
//   Department of Homeland Security.
// 
// 
// FOR MORE INFORMATION VISIT
// 
// http://krona.sourceforge.net
// 
//-----------------------------------------------------------------------------
}

var canvas;
var context;
var svg; // for snapshot mode
var collapse;
var collapseCheckBox;
var collapseLast;
var maxAbsoluteDepthText;
var maxAbsoluteDepthButtonDecrease;
var maxAbsoluteDepthButtonIncrease;
var fontSize;
var fontSizeText;
var fontSizeButtonDecrease;
var fontSizeButtonIncrease;
var fontSizeLast;
var shorten;
var shortenCheckBox;
var maxAbsoluteDepth;
var backButton;
var upButton;
var forwardButton;
var snapshotButton;
var snapshotMode = false;
var details;
var detailsName;
var search;
var searchResults;
var nSearchResults;
var useHueCheckBox;
var useHueDiv;

addOptionElements();
setCallBacks();

var nodeID = 0; // incremented during loading to assign unique node IDs

// Node references. Note that the meanings of 'selected' and 'focused' are
// swapped in the docs.
//
var head; // the root of the entire tree
var selectedNode = 0; // the root of the current view
var focusNode = 0; // a node chosen for more info (single-click)
var highlightedNode = 0; // mouse hover node
var highlightingHidden = false;

var nodeHistory = new Array();
var nodeHistoryPosition = 0;

// selectedNodeLast is separate from the history, since we need to check
// properties of the last node viewed when browsing through the history
//
var selectedNodeLast = 0;
var zoomOut = false;

// temporary zoom-in while holding the mouse button on a wedge
//
var quickLook = false; // true when in quick look state
var mouseDown = false;
var mouseDownTime; // to detect mouse button hold
var quickLookHoldLength = 200;

var imageWidth;
var imageHeight;
var centerX;
var centerY;
var gRadius;
var updateViewNeeded = false;

// Determines the angle that the pie chart starts at.  90 degrees makes the
// center label consistent with the children.
//
var rotationOffset = Math.PI / 2;

var buffer = 100;

// The maps are the small pie charts showing the current slice being viewed.
//
var mapBuffer = 10;
var mapRadius = 0;
var maxMapRadius = 25;
var mapWidth = 150;
var maxLabelOverhang = Math.PI * 4.18;

// Keys are the labeled boxes for slices in the highest level that are too thin
// to label.
//
var maxKeySizeFactor = 2; // will be multiplied by font size
var keySize;
var keys;
var keyBuffer = 10;
var currentKey;
var keyMinTextLeft;
var keyMinAngle;

var minRingWidthFactor = 5; // will be multiplied by font size
var maxPossibleDepth; // the theoretical max that can be displayed
var maxDisplayDepth; // the actual depth that will be displayed
var headerHeight = 0;//document.getElementById('options').clientHeight;
var historySpacingFactor = 1.6; // will be multiplied by font size
var historyAlphaDelta = .25;

// appearance
//
var lineOpacity = 0.3;
var saturation = 0.55;
var lightnessBase = 0.6;
var lightnessMax = .8;
var lightnessFactor = 0.0175;
var thinLineWidth = .25;
var highlightLineWidth = 1.5;
var labelBoxBuffer = 6;
var labelBoxRounding = 15;
var labelWidthFudge = 1.05; // The width of unshortened labels are set slightly
							// longer than the name width so the animation
							// finishes faster.
var fontNormal;
var fontBold;
var fontFaceNormal = 'Times new roman';
//var fontFaceBold = 'bold Arial';
var nodeRadius;
var angleFactor;
var tickLength;

// label staggering
//
var labelOffsets; // will store the current offset at each depth
//
// This will store pointers to the last node that had a label in each offset (or "track") of a
// each depth.  These will be used to shorten neighboring labels that would overlap.
// The [nLabelNodes] index will store the last node with a radial label.
// labelFirstNodes is the same, but to check for going all the way around and
// overlapping the first labels.
//
var labelLastNodes;
var labelFirstNodes;
//
var nLabelOffsets = 3; // the number of offsets to use

var mouseX = -1;
var mouseY = -1;

// tweening
//
var progress = 0; // for tweening; goes from 0 to 1.
var progressLast = 0;
var tweenFactor = 0; // progress converted by a curve for a smoother effect.
var tweenLength = 850; // in ms
var tweenCurvature = 13;
//
// tweenMax is used to scale the sigmoid function so its range is [0,1] for the
// domain [0,1]
//
var tweenMax = 1 / (1 + Math.exp(-tweenCurvature / 2));
//
var tweenStartTime;

// for framerate debug
//
var tweenFrames = 0;
var fpsDisplay = document.getElementById('frameRate');

// Arrays to translate xml attribute names into displayable attribute names
//
var attributeNames = new Array();
var attributeDisplayNames = new Array();

// For defining gradients
//
var hueDisplayName;
var hueStopPositions;
var hueStopHues;
var hueStopText;

document.body.style.overflow = "hidden";
window.onload = load;

var image;
var hiddenPattern;

image = document.getElementById('hiddenImage');

if ( image.complete )
{
	hiddenPattern = context.createPattern(image, 'repeat');
}
else
{
	image.onload = function()
	{
		hiddenPattern = context.createPattern(image, 'repeat');
	}
}

function resize()
{
	imageWidth = window.innerWidth;
	imageHeight = window.innerHeight;
	
	if ( ! snapshotMode )
	{
		context.canvas.width = imageWidth;
		context.canvas.height = imageHeight;
	}
	
	var minDimension = imageWidth - mapWidth > imageHeight ?
		imageHeight :
		imageWidth - mapWidth;
	
	maxMapRadius = minDimension * .03;
	buffer = minDimension * .1;
	margin = minDimension * .015;
	centerX = (imageWidth - mapWidth) / 2;
	centerY = imageHeight / 2;
	gRadius = minDimension / 2 - buffer;
	maxPossibleDepth = Math.floor(gRadius / (fontSize * minRingWidthFactor));
}

function handleResize()
{
	updateViewNeeded = true;
}

function Tween(start, end)
{
	this.start = start;
	this.end = end;
	this.current = this.start;
	
	this.current = function()
	{
		if ( progress == 1 || this.start == this.end )
		{
			return this.end;
		}
		else
		{
			return this.start + tweenFactor * (this.end - this.start);
		}
	};
	
	this.setTarget = function(target)
	{
		this.start = this.current();
		this.end = target;
	}
}

function Node()
{
	this.angleStart = new Tween(Math.PI, 0);
	this.angleEnd = new Tween(Math.PI, 0);
	this.radiusInner = new Tween(1, 1);
	this.labelRadius = new Tween(1, 1);
	this.labelWidth = new Tween(0, 0);
	this.scale = new Tween(1, 1); // TEMP
	this.radiusOuter = new Tween(1, 1);
	
	this.r = new Tween(255, 255);
	this.g = new Tween(255, 255);
	this.b = new Tween(255, 255);
	
	this.alphaLabel = new Tween(0, 1);
	this.alphaLine = new Tween(0, 1);
	this.alphaWedge = new Tween(0, 1);
	this.children = Array();
	this.parent = 0;
	
	this.attributes = new Array();
	
	this.addChild = function(child)
	{
		this.children.push(child);
	};
	
	this.addLabelNode = function(depth, labelOffset)
	{
		if ( labelHeadNodes[depth][labelOffset] == 0 )
		{
			// this will become the head node for this list
			
			labelHeadNodes[depth][labelOffset] = this;
			this.labelPrev = this;
		}
		
		var head = labelHeadNodes[depth][labelOffset];
		
		this.labelNext = head;
		this.labelPrev = head.labelPrev;
		head.labelPrev.labelNext = this;
		head.labelPrev = this;
	}
	
	this.addSearchResultString = function(label)
	{
		var searchResults = this.containsSearchResult;
		
		if ( this.searchResult )
		{
			// don't count ourselves
			searchResults--;
		}
		
		return label + ' - ' + searchResults + (searchResults > 1 ? ' results' : ' result');
	}
	
	this.canDisplayDepth = function()
	{
		// whether this node is at a depth that can be displayed, according
		// to the max absolute depth
		
		return this.depth <= maxAbsoluteDepth;
	}
	
	this.canDisplayHistory = function()
	{
		return (
			-this.labelRadius.end * gRadius +
			historySpacingFactor * fontSize / 2 <
			nodeRadius * gRadius
			);
	}
	this.canDisplayLabel = function()
	{
		return (
			(this.angleEnd.end - this.angleStart.end) *
			(this.radiusInner.end * gRadius + gRadius) >=
			minWidth());
	}
	
	this.canDisplayLabelCurrent = function()
	{
		return (
			(this.angleEnd.current() - this.angleStart.current()) *
			(this.radiusInner.current() * gRadius + gRadius) >=
			minWidth());
	}
	
	this.canHide = function(selected)
	{
		return	!(
//			this.canDisplayLabel() ||//Current ||
			this.canDisplayLabelCurrent() ||
			this.getDepth() == selectedNode.getDepth() + 1 && selected || // keyed wedge
			(
				// was keyed wedge
				this.getParent() == selectedNodeLast &&
				selectedNode.hasParent(selectedNodeLast)
			)
		);
	}
	
	this.checkHighlight = function()
	{
		if ( this.children.length == 0 && this == focusNode )
		{
			//return false;
		}
		
		if ( this.radiusInner.end == 1 )
		{
			// compressed to the outside; don't check
			
			return false;
		}
		
		var highlighted = false;
		
		var angleStartCurrent = this.angleStart.current() + rotationOffset;
		var angleEndCurrent = this.angleEnd.current() + rotationOffset;
		var radiusInner = this.radiusInner.current() * gRadius;
		
		if ( this.canDisplayLabel() || this.getCollapse() )
		{
			for ( var i = 0; i < this.children.length; i++ )
			{
				highlighted = this.children[i].checkHighlight();
				
				if ( highlighted )
				{
					return true;
				}
			}
		}
		else
		{
			if ( this.getDepth() - selectedNode.getDepth() != 1 )
			{
				return false;
			}
		}
		
		if ( this != selectedNode && ! this.getCollapse() )
		{
			context.beginPath();
			context.arc(0, 0, radiusInner, angleStartCurrent, angleEndCurrent, false);
			context.arc(0, 0, gRadius, angleEndCurrent, angleStartCurrent, true);
			context.closePath();
			
			if ( context.isPointInPath(mouseX - centerX, mouseY - centerY) )
			{
				highlighted = true;
			}
			
			if
			(
				! highlighted &&
				(angleEndCurrent - angleStartCurrent) *
				(radiusInner + gRadius) <
				minWidth() &&
				this.getDepth() == selectedNode.getDepth() + 1
			)
			{
				if ( this.checkHighlightKey() )
				{
					highlighted = true;
				}
			}
		}
		
		if ( highlighted )
		{
			if ( this != highlightedNode )
			{
			//	document.body.style.cursor='pointer';
			}
			
			highlightedNode = this;
		}
		
		return highlighted;
	}
	
	this.checkHighlightCenter = function()
	{
		if ( ! this.canDisplayHistory() )
		{
			return;
		}
		
		var cx = centerX;
		var cy = centerY - this.labelRadius.end * gRadius;
		//var dim = context.measureText(this.name);
		
		var width = this.nameWidth;
		
		if ( this.shouldAddSearchResultsString() )
		{
			var results = this.addSearchResultString('');
			var dim = context.measureText(results);
			width += dim.width;
		}
		
		if
		(
			mouseX > cx - width / 2 &&
			mouseX < cx + width / 2 &&
			mouseY > cy - historySpacingFactor * fontSize / 2 &&
			mouseY < cy + historySpacingFactor * fontSize / 2
		)
		{
			highlightedNode = this;
			return;
		}
		
		if ( this.getParent() )
		{
			this.getParent().checkHighlightCenter();
		}
	}
	
	this.checkHighlightKey = function()
	{
		var offset = keyOffset();
		
		var xMin = imageWidth - keySize - margin - this.keyNameWidth - keyBuffer;
		var xMax = imageWidth - margin;
		var yMin = offset;
		var yMax = offset + keySize;
		
		currentKey++;
		
		return (
			mouseX > xMin &&
			mouseX < xMax &&
			mouseY > yMin &&
			mouseY < yMax);
	}
	
	this.checkHighlightMap = function()
	{
		if ( this.parent )
		{
			this.parent.checkHighlightMap();
		}
		
		if ( this.getCollapse() || this == focusNode )
		{
			return;
		}
		
		var box = this.getMapPosition();
		
		if
		(
			mouseX > box.x - mapRadius &&
			mouseX < box.x + mapRadius &&
			mouseY > box.y - mapRadius &&
			mouseY < box.y + mapRadius
		)
		{
			highlightedNode = this;
		}
	}
	
/*	this.collapse = function()
	{
		for (var i = 0; i < this.children.length; i++ )
		{
			this.children[i] = this.children[i].collapse();
		}
		
		if
		(
			this.children.length == 1 &&
			this.children[0].magnitude == this.magnitude
		)
		{
			this.children[0].parent = this.parent;
			this.children[0].getDepth() = this.parent.getDepth() + 1;
			return this.children[0];
		}
		else
		{
			return this;
		}
	}
*/	
	this.draw = function(labelMode, selected, searchHighlighted)
	{
		var depth = this.getDepth() - selectedNode.getDepth() + 1;
//		var hidden = false;
		
		if ( selectedNode == this )
		{
			selected = true;
		}
		
		var angleStartCurrent = this.angleStart.current() + rotationOffset;
		var angleEndCurrent = this.angleEnd.current() + rotationOffset;
		var radiusInner = this.radiusInner.current() * gRadius;
		var canDisplayLabelCurrent = this.canDisplayLabelCurrent();
		
		if
		(
//			false &&
			!(
//				this.canDisplayLabel() ||//Current ||
				canDisplayLabelCurrent ||
				depth == 2 && selected || // keyed wedge
				(
					// was keyed wedge
					this.getParent() == selectedNodeLast &&
					selectedNode.hasParent(selectedNodeLast)
				)
			)
		)
		{
			//return this.canDisplayDepth(); // hidden
		}
		
		var hiddenChildren = 0;
		var firstHiddenChild = this.children.length;
		var hiddenColorStart;
		var canDisplayChildren = false;
		var hiddenSearchResults = 0;
		var hiddenHueTotal = 0;
		
		if ( canDisplayLabelCurrent )
		{
			// check if children will be displayed
			//
			for ( var i = 0; i < this.children.length; i++ )
			{
				var child = this.children[i];
				
				if
				(
					child.getDepth() - selectedNode.getDepth() + 1 <=
					maxDisplayDepth && this.depth < maxAbsoluteDepth ||
					progress < 1
				)
				{
					if ( child.canHide(selected) )
					{
						if ( hiddenChildren == 0 )
						{
							firstHiddenChild = i;
						}
						
						if ( child.containsSearchResult )
						{
							hiddenSearchResults += child.containsSearchResult;
						}
						
						if ( child.hue != null )
						{
							hiddenHueTotal += child.hue;
						}
						
						hiddenChildren++;
					}
					else
					{
						hiddenChildren = 0;
						firstHiddenChild = this.children.length;
						hiddenSearchResults = 0;
						hiddenHueTotal = 0;
					}
					
					uncollapsed = child.getUncollapsed();
					
					if
					(
						uncollapsed.canDisplayLabelCurrent() &&
						uncollapsed.alphaLine.current() > 0 &&
						uncollapsed.alphaLabel.current() > 0
					)
					{
						canDisplayChildren = true;
						//break;
					}
				}
				
				if
				(
					child.getDepth() - selectedNode.getDepth() + 1 >
					maxDisplayDepth &&
					child.containsSearchResult
				)
				{
					hiddenSearchResults = 1;
				}
				
				if
				(
					child.depth > maxAbsoluteDepth &&
					child.containsSearchResult
				)
				{
					hiddenSearchResults = 1;
				}
			}
		}
		
		if ( this == focusNode ) // TEMP
		{
			//canDisplayChildren = true;
		}
		
		if ( this.alphaLine.current() > 0 || this.alphaLabel.current() > 0 )
		{
			if ( labelMode )
			{
				var drawRadial =
				!(
					this.getParent() &&
					this.getParent() != selectedNode &&
					this.angleEnd.current() == this.getParent().angleEnd.current()
				);
				
				this.drawLines(angleStartCurrent, angleEndCurrent, radiusInner, drawRadial);
				
				if
				(
					this == selectedNode
				)
				{
					this.drawReferenceRings();
				}
				
				if
				(
					selected &&
					! searchHighlighted &&
					this != selectedNode &&
					(
						this.searchResult ||
						hiddenSearchResults ||
						! canDisplayLabelCurrent &&
						this.containsSearchResult
					)
				)
				{
					this.drawHighlight();
					searchHighlighted = true;
				}
				else if ( this == selectedNode || (canDisplayLabelCurrent) && this != highlightedNode && this != focusNode )
				{
					context.globalAlpha = this.alphaLabel.current();
					
					if ( this == selectedNode )
					{
						context.font = fontBold;
					}
					else
					{
						context.font = fontNormal;
					}
					
					this.drawLabel
					(
						(angleStartCurrent + angleEndCurrent) / 2,
						(this.searchResult || hiddenSearchResults || !canDisplayLabelCurrent && this.containsSearchResult) && selected,
						selected
					);
				}
			}
			else
			{
				var currentR = this.r.current();
				var currentG = this.g.current();
				var currentB = this.b.current();
				
				context.globalAlpha = 1;
				
				if
				(
					currentR < 255 ||
					currentG < 255 ||
					currentB < 255
				)
				{
					var fill;
					
					if ( useHue() )
					{
						fill = hslText(this.hue);
						context.globalAlpha = this.alphaWedge.current();
					}
					else
					{
						fill = rgbText(currentR, currentG, currentB);
					}
					
					var radiusOuter;
					var lastChildAngle;
					var keyed = false;
					
					if
					(
						!this.canDisplayLabel() &&
						selected &&
						depth == 2 &&
						!this.getCollapse()
					)
					{
						keyed = true;
					}
					
					if
					(
						canDisplayChildren &&
						! keyed &&
						depth < maxDisplayDepth
					)
					{
						radiusOuter = this.children[0].getUncollapsed().radiusInner.current() * gRadius + 1;
					}
					else
					{
						radiusOuter = gRadius;
					}
					/*
					if ( this.hasChildren() )
					{
						radiusOuter = this.children[0].getUncollapsed().radiusInner.current() * gRadius + 1;
					}
					else
					{ // TEMP
						radiusOuter = radiusInner + nodeRadius * gRadius;
						
						if ( radiusOuter > gRadius )
						{
							radiusOuter = gRadius;
						}
					}
					*/
					var drawPattern = this.hasChildren() && ! canDisplayChildren;
					
					drawWedge
					(
						angleStartCurrent,
						angleEndCurrent,
						radiusInner,
						radiusOuter,//this.radiusOuter.current() * gRadius,
						//'rgba(0, 200, 0, .1)',
						fill,
						drawPattern ? this.alphaLine.current() : 0
					);
					
					if ( this.hasChildren() && ! keyed )
					{
						// fill in the extra space if the sum of our childrens'
						// magnitudes is less than ours
						
						var lastChild = this.children[this.children.length - 1];
						var lastChildAngleEnd = lastChild.angleEnd.current() + rotationOffset;
						
						if ( lastChildAngleEnd < angleEndCurrent )//&& false) // TEMP
						{
							drawWedge
							(
								lastChildAngleEnd,
								angleEndCurrent,
								radiusOuter - 1,
								gRadius,//this.radiusOuter.current() * gRadius,
								//'rgba(200, 0, 0, .1)',
								fill,
								0
							);
						}
					}
					
					if ( keyed )
					{
						this.drawKey
						(
							(angleStartCurrent + angleEndCurrent) / 2,
							drawPattern,
							(
								this == highlightedNode ||
								this == focusNode ||
								this.containsSearchResult
							)
						);
					}
				}
			}
		}
		
		if ( canDisplayLabelCurrent || this.getCollapse() )
		{
			// draw children
			//
			for ( var i = 0; i < firstHiddenChild; i++ )
			{
				if
				(
					this.children[i].getDepth() - selectedNode.getDepth() + 1 <=
					maxDisplayDepth ||
					progress < 1
				)
				{
					this.children[i].draw(labelMode, selected, searchHighlighted);
				}
			}
		}
		
		if ( hiddenChildren > 0 && canDisplayChildren )//&& depth < maxDisplayDepth )
		{
			this.drawHiddenChildren
			(
				this.children[firstHiddenChild],
				hiddenChildren,
				selected,
				labelMode,
				hiddenSearchResults,
				hiddenHueTotal / hiddenChildren
			);
		}
		
		return false; // not hidden
	};
	
	this.drawHiddenChildren = function
	(
		firstHiddenChild,
		hiddenChildren,
		selected,
		labelMode,
		hiddenSearchResults,
		hue
	)
	{
		// represent children that are too small to draw with a color
		// gradient
		
		var angleStart = firstHiddenChild.angleStart.current() + rotationOffset;
		var lastChild = this.children[this.children.length - 1];
		var angleEnd = lastChild.angleEnd.current() + rotationOffset;
		var radiusInner = gRadius * this.children[0].radiusInner.current();
		
		if ( labelMode )
		{
			var drawRadial = (angleEnd < this.angleEnd.current() + rotationOffset);
			
			this.drawLines(angleStart, angleEnd, radiusInner, drawRadial);
			
			if
			(
				selected &&
				(angleEnd - angleStart) * 
				(gRadius + gRadius) >=
				minWidth() ||
				hiddenSearchResults
			)
			{
	//				context.globalAlpha = lastChild.getUncollapsed().alphaLabel.current();
				context.fillStyle = 'black';//'rgb(90,90,90)';
				
				this.drawHiddenLabel
				(
					angleStart,
					angleEnd,
					hiddenSearchResults ?
						hiddenSearchResults + ' result' + (hiddenSearchResults > 1 ? 's' : '') :
						hiddenChildren,
					hiddenSearchResults
				);
			}
		}
		else
		{
			context.globalAlpha = 1;
			
			var fill;
			
			if ( useHue() )
			{
				fill = hslText(hue);
				context.globalAlpha = firstHiddenChild.alphaWedge.current();
			}
			else
			{
				fill = rgbText
				(
					firstHiddenChild.r.current(),
					firstHiddenChild.g.current(),
					firstHiddenChild.b.current()
				);
			}
			
			drawWedge
			(
				angleStart,
				angleEnd,
				radiusInner,
				gRadius,//this.radiusOuter.current() * gRadius,
				fill,
				this.alphaLine.current()
			);
		}
	}
	
	this.drawHiddenLabel = function(angleStart, angleEnd, value, hiddenSearchResults)
	{
		var textAngle = (angleStart + angleEnd) / 2;
		var labelRadius = gRadius + fontSize;//(radiusInner + radius) / 2;
		
		drawTick(gRadius - fontSize * .75, fontSize * 1.5, textAngle);
		this.drawTextFlipped(value.toString(), 0, textAngle, labelRadius, true, hiddenSearchResults);
	}
	
	this.drawHighlight = function()
	{
		if ( snapshotMode )
		{
			this.drawHighlightSVG();
		}
		else
		{
			this.drawHighlightCanvas();
		}
	}
	
	this.drawHighlightCanvas = function()
	{
		if ( !this.hasChildren() && this.getParent() != selectedNode )
		{
			//this.getParent().drawHighlight();
		}
		
		var hiddenChildren = 0;
		var hiddenAngleStart;
		var highlightHidden = false;
		
		// set style
		//
		context.save();
		context.lineWidth = highlightLineWidth;
		
		var angleStartCurrent = this.angleStart.current() + rotationOffset;
		var angleEndCurrent = this.angleEnd.current() + rotationOffset;
		var radiusInner = this.radiusInner.current() * gRadius;
		
		this.setHighlightStyle();
		
		if ( this == focusNode && this == highlightedNode && this.hasChildren() )
		{
//			context.fillStyle = "rgba(255, 255, 255, .3)";
			arrow
			(
				angleStartCurrent,
				angleEndCurrent,
				radiusInner
			);
		}
		else
		{
	//		context.globalAlpha = 1;
			
			context.beginPath();
			context.arc(0, 0, radiusInner, angleStartCurrent, angleEndCurrent, false);
			context.arc(0, 0, gRadius, angleEndCurrent, angleStartCurrent, true);
			context.closePath();
			
			context.fill();
			context.stroke();
		}
		
		var canDisplayChildren = false;
		
		// check if hidden children should be highlighted
		//
		for ( var i = 0; i < this.children.length; i++ )
		{
			if
			(
				this.children[i].getDepth() - selectedNode.getDepth() + 1 <=
				maxDisplayDepth &&
				!this.children[i].canDisplayLabel()
			)
			{
				if ( hiddenChildren == 0 )
				{
					hiddenAngleStart = this.children[i].angleStart.current() + rotationOffset;
				}
				
				hiddenChildren++;
			}
			else
			{
				canDisplayChildren = true;
				hiddenChildren = 0;
			}
		}
		//
		if ( canDisplayChildren && hiddenChildren > 0 && this.canDisplayLabel() )
		{
			var lastChild = this.children[this.children.length - 1];
			var hiddenAngleEnd = lastChild.angleEnd.current() + rotationOffset;
			var hiddenRadiusInner = gRadius * this.children[0].radiusInner.current();
			
			// this needs to be untranslated because browsers vary on whether
			// they apply translations for isPointInPath
			//
			context.translate(-centerX, -centerY);
			//
			context.beginPath();
			context.arc(centerX, centerY, hiddenRadiusInner, hiddenAngleStart, hiddenAngleEnd, false);
			context.arc(centerX, centerY, gRadius, hiddenAngleEnd, hiddenAngleStart, true);
			context.closePath();
			//
			var highlightHidden = context.isPointInPath(mouseX, mouseY);
			//
			context.translate(centerX, centerY);
			
			if ( highlightHidden )
			{
				context.strokeStyle = 'rgb(90,90,90)';
				context.fill();
				context.stroke();
				context.fillStyle = 'black';
				
				if ( ! this.containsSearchResult )
				{
					this.drawHiddenLabel
					(
						hiddenAngleStart,
						hiddenAngleEnd,
						hiddenChildren
					);
				}
				highlightHidden = true;
			}
		}
		
//			context.strokeStyle = 'black';
		context.fillStyle = 'black';
		
		if ( progress < 1 && zoomOut && this == selectedNodeLast)
		{
			context.font = fontNormal;
		}
		else
		{
			context.font = fontBold;
		}
		
		var angle = (angleEndCurrent + angleStartCurrent) / 2;
		
		if ( this.canDisplayLabel() )
		{
			this.drawLabel(angle, true, false);
		}
	}
	
	this.drawHighlightSVG = function()
	{
		var angleStartCurrent = this.angleStart.current() + rotationOffset;
		var angleEndCurrent = this.angleEnd.current() + rotationOffset;
		var radiusInner = this.radiusInner.current() * gRadius;
		
		drawWedge
		(
			angleStartCurrent,
			angleEndCurrent,
			radiusInner,
			gRadius,
			'rgba(255, 255, 255, .3)',
			0,
			true
		);
		
		var angle = (angleStartCurrent + angleEndCurrent) / 2;
		
		context.font = fontBold;
		
		if ( this.canDisplayLabel() )
		{
			this.drawLabel(angle, true, false);
		}
	}
	
	this.drawHighlightCenter = function()
	{
		if ( ! this.canDisplayHistory() )
		{
			return;
		}
		
		context.lineWidth = highlightLineWidth;
		context.strokeStyle = 'black';
		context.fillStyle = "rgba(255, 255, 255, .6)";
		
		context.fillStyle = 'black';
		context.font = fontBold;
		this.drawLabel(3 * Math.PI / 2, true, false);
	}
	
	this.drawKey = function(angle, drawPattern, highlight)
	{
		var offset = keyOffset();
		var percentage = this.getPercentage();
		
		var color;
		
		if ( useHue() )
		{
			color = hslText(this.hue);
		}
		else
		{
			color = rgbText(this.r.end, this.g.end, this.b.end);
		}
		
		var boxLeft = imageWidth - keySize - margin;
		var textY = offset + keySize / 2;
		
		var label = this.name + '   ' + percentage + '%';
		var labelLength;
		
		if ( highlight )
		{
			labelLength = label.length;
			
			if ( this.shouldAddSearchResultsString() )
			{
				label = this.addSearchResultString(label);
			}
		}
		
		if ( this == highlightedNode || this == focusNode )
		{
			context.font = fontBold
		}
		else
		{
			context.font = fontNormal;
		}
		
		var dim = context.measureText(label);
		this.keyNameWidth = dim.width;
		var textLeft = boxLeft - keyBuffer - dim.width - fontSize / 2;
		var labelLeft = textLeft;
		
		if ( labelLeft > keyMinTextLeft - fontSize / 2 )
		{
			keyMinTextLeft -= fontSize / 2;
			
			if ( keyMinTextLeft < centerX - gRadius + fontSize / 2 )
			{
				keyMinTextLeft = centerX - gRadius + fontSize / 2;
			}
			
			labelLeft = keyMinTextLeft;
		}
		
		var lineX = new Array();
		var lineY = new Array();
		
		var bendRadius;
		var keyAngle = Math.atan((textY - centerY) / (labelLeft - centerX));
		var arcAngle;
		
		if ( keyAngle < 0 )
		{
			keyAngle += Math.PI;
		}
		
		if ( keyMinAngle == 0 || angle < keyMinAngle )
		{
			keyMinAngle = angle;
		}
		
		if ( angle > Math.PI && keyMinAngle > Math.PI )
		{
			// allow lines to come underneath the chart
			
			angle -= Math.PI * 2;
		}
		
		lineX.push(Math.cos(angle) * gRadius);
		lineY.push(Math.sin(angle) * gRadius);
		
		if ( angle < keyAngle && textY > centerY + Math.sin(angle) * (gRadius + buffer * (currentKey - 1) / (keys + 1) / 2 + buffer / 2) )
		{
			bendRadius = gRadius + buffer - buffer * currentKey / (keys + 1) / 2;
		}
		else
		{
			bendRadius = gRadius + buffer * currentKey / (keys + 1) / 2 + buffer / 2;
		}
		
		var outside =
			Math.sqrt
			(
				Math.pow(labelLeft - centerX, 2) +
				Math.pow(textY - centerY, 2)
			) > bendRadius;
		
		if ( ! outside )
		{
			arcAngle = Math.asin((textY - centerY) / bendRadius);
			
			keyMinTextLeft = min(keyMinTextLeft, centerX + bendRadius * Math.cos(arcAngle) - fontSize / 2);
			
			if ( labelLeft < textLeft && textLeft > centerX + bendRadius * Math.cos(arcAngle) )
			{
				lineX.push(textLeft - centerX);
				lineY.push(textY - centerY);
			}
		}
		else
		{
			keyMinTextLeft = min(keyMinTextLeft, labelLeft - fontSize / 2);
			
			if ( angle < keyAngle )
			{
				// flip everything over y = x
				//
				arcAngle = Math.PI / 2 - keyLineAngle
				(
					Math.PI / 2 - angle,
					Math.PI / 2 - keyAngle,
					bendRadius,
					textY - centerY,
					labelLeft - centerX,
					lineY,
					lineX
				);
				
			}
			else
			{
				arcAngle = keyLineAngle
				(
					angle,
					keyAngle,
					bendRadius,
					labelLeft - centerX,
					textY - centerY,
					lineX,
					lineY
				);
			}
		}
		
		if ( labelLeft > centerX + bendRadius * Math.cos(arcAngle) ||
		textY > centerY + bendRadius * Math.sin(arcAngle) + .01)
//		if ( outside ||  )
		{
			lineX.push(labelLeft - centerX);
			lineY.push(textY - centerY);
			
			if ( textLeft != labelLeft )
			{
				lineX.push(textLeft - centerX);
				lineY.push(textY - centerY);
			}
		}
		
		context.globalAlpha = 1;
		
		if ( snapshotMode )
		{
			var labelSVG = this.name + '&#160;&#160;&#160;' + percentage + '%';
			
			svg +=
				'<rect fill="' + color + '" ' +
				'x="' + boxLeft + '" y="' + offset +
				'" width="' + keySize + '" height="' + keySize + '"/>';
			
			if ( drawPattern )
			{
				svg +=
					'<rect fill="url(#hiddenPattern)" style="stroke:none" ' +
					'x="' + boxLeft + '" y="' + offset +
					'" width="' + keySize + '" height="' + keySize + '"/>';
			}
			
			svg +=
				'<path class="line" style="stroke-width:' +
				(highlight ? highlightLineWidth : thinLineWidth) +
				'" d="M ' + (lineX[0] + centerX) + ',' +
				(lineY[0] + centerY);
			
			if ( angle != arcAngle )
			{
				svg +=
					' L ' + (centerX + bendRadius * Math.cos(angle)) + ',' +
					(centerY + bendRadius * Math.sin(angle)) +
					' A ' + bendRadius + ',' + bendRadius + ' 0 ' +
					'0,' + (angle > arcAngle ? '0' : '1') + ' ' +
					(centerX + bendRadius * Math.cos(arcAngle)) + ',' +
					(centerY + bendRadius * Math.sin(arcAngle));
			}
			
			for ( var i = 1; i < lineX.length; i++ )
			{
				svg +=
					' L ' + (centerX + lineX[i]) + ',' +
					(centerY + lineY[i]);
			}
			
			svg += '"/>';
			
			if ( highlight )
			{
				var labelLength = label.length;
				
				if ( this.shouldAddSearchResultsString() )
				{
					labelSVG = this.addSearchResultString(labelSVG);
				}
				
				drawBubbleSVG
				(
					boxLeft - keyBuffer - dim.width - fontSize / 2,
					textY - fontSize,
					dim.width + fontSize,
					fontSize * 2,
					fontSize,
					0
				);
				
				if ( this.searchResult )
				{
					this.drawSearchHighlights
					(
						label,
						labelLength,
						boxLeft - keyBuffer - dim.width,
						textY,
						0
					)
				}
			}
			
			svg +=
				'<text x="' + (boxLeft - keyBuffer) + '" ' +
				'y="' + textY + '" style=\'text-anchor:end;font:' + context.font + '\'>' +
				labelSVG + '</text>';
		}
		else
		{
			context.fillStyle = color;
			context.translate(-centerX, -centerY);
			context.strokeStyle = 'black';
				context.globalAlpha = this.alphaLine.current();
			
			context.fillRect(boxLeft, offset, keySize, keySize);
			
			if ( drawPattern )
			{
				context.fillStyle = hiddenPattern;
				context.fillRect(boxLeft, offset, keySize, keySize);
				context.fillRect(boxLeft, offset, keySize, keySize);
			}
			
			if ( this == highlightedNode || this == focusNode )
			{
				this.setHighlightStyle();
				context.fillRect(boxLeft, offset, keySize, keySize);
			}
			else
			{
				context.lineWidth = thinLineWidth;
			}
			
			context.strokeRect(boxLeft, offset, keySize, keySize);
			
			if ( lineX.length )
			{
				context.beginPath();
				//alert(this.name + ' ' + keyAngle);
				context.moveTo(lineX[0] + centerX, lineY[0] + centerY);
				
				context.arc(centerX, centerY, bendRadius, angle, arcAngle, angle > arcAngle);
				
				for ( var i = 1; i < lineX.length; i++ )
				{
					context.lineTo(lineX[i] + centerX, lineY[i] + centerY);
				}
				
				context.globalAlpha = this.alphaLine.current();
				context.stroke();
			}
			
			if ( highlight )
			{
				drawBubbleCanvas
				(
					boxLeft - keyBuffer - dim.width - fontSize / 2,
					textY - fontSize,
					dim.width + fontSize,
					fontSize * 2,
					fontSize,
					0
				);
				
				if ( this.searchResult )
				{
					this.drawSearchHighlights
					(
						label,
						labelLength,
						boxLeft - keyBuffer - dim.width,
						textY,
						0
					)
				}
			}
			
			context.textAlign = 'end';
//			context.lineWidth *= .75;
			context.fillStyle = 'black';
			context.fillText(label, boxLeft - keyBuffer, offset + keySize / 2);
			
			
			context.translate(centerX, centerY);
		}
		
		currentKey++;
	}
	
	this.drawLabel = function(angle, highlight, selected)
	{
		var innerText;
		var label;
		var radius = this.labelRadius.current() * gRadius;
		
		if ( this.radial && (selected || highlight ) )
		{
			var percentage = this.getPercentage();
			innerText = percentage + '%';
		}
		
		if
		(
			! this.radial &&
			this != selectedNode &&
			! highlight &&
			( !zoomOut || this != selectedNodeLast)
		)
		{
			label = this.shortenLabel();
		}
		else
		{
			label = this.name;
		}
		
		var flipped = this.drawTextFlipped
		(
			label,
			innerText,
			angle,
			radius,
			this.radial,
			highlight,
			this.shouldAddSearchResultsString() && (!selected || this == selectedNode || highlight),
			true
		);
		
		if
		(
			! this.radial &&
			! highlight &&
			this != selectedNode &&
			this.angleEnd.end != this.angleStart.end &&
			this.nameWidth > (this.angleEnd.end - this.angleStart.end) * Math.abs(radius) &&
			! ( zoomOut && this == selectedNodeLast ) &&
			this.labelRadius.end > 0
		)
		{
			// name extends beyond wedge; draw tick mark towards the central
			// radius for easier identification
			
			var radiusCenter = (this.getDepth() - selectedNode.getDepth() + .5) * nodeRadius;
			
			if ( this.labelRadius.end > radiusCenter )
			{
				if ( flipped )
				{
					drawTick(radius - tickLength * 1.4 , tickLength, angle);
				}
				else
				{
					drawTick(radius - tickLength * 1.7, tickLength, angle);
				}
			}
			else
			{
				if ( flipped )
				{
					drawTick(radius + tickLength * .7, tickLength, angle);
				}
				else
				{
					drawTick(radius + tickLength * .4, tickLength, angle);
				}
			}
		}
	}
	
	this.drawLines = function(angleStart, angleEnd, radiusInner, drawRadial)
	{
		if ( snapshotMode )
		{
			if ( this != selectedNode)
			{
				var longArc = angleEnd - angleStart > Math.PI ? 1 : 0;
				
				var x1 = centerX + radiusInner * Math.cos(angleStart);
				var y1 = centerY + radiusInner * Math.sin(angleStart);
				
				var x2 = centerX + gRadius * Math.cos(angleStart);
				var y2 = centerY + gRadius * Math.sin(angleStart);
				
				var x3 = centerX + gRadius * Math.cos(angleEnd);
				var y3 = centerY + gRadius * Math.sin(angleEnd);
				
				var x4 = centerX + radiusInner * Math.cos(angleEnd);
				var y4 = centerY + radiusInner * Math.sin(angleEnd);
				
				dArray =
				[
					" M ", x4, ",", y4,
					" A ", radiusInner, ",", radiusInner, " 0 ", longArc, " 0 ", x1, ",", y1
				];
				
				svg += '<path class="line" d="' + dArray.join('') + '"/>';
				
				if ( drawRadial )
				{
					svg += '<line x1="' + x3 + '" y1="' + y3 + '" x2="' + x4 + '" y2="' + y4 + '"/>';
				}
			}
		}
		else
		{
			var x1 = gRadius * Math.cos(angleEnd);
			var y1 = gRadius * Math.sin(angleEnd);
			
			context.lineWidth = thinLineWidth;
			context.beginPath();
			context.arc(0, 0, radiusInner, angleStart, angleEnd, false);
			
			if ( drawRadial )
			{
				context.lineTo(x1, y1);
			}
			
			context.strokeStyle = 'black';
			context.globalAlpha = this.alphaLine.current();
			context.stroke();
		}
	}
	
	this.drawMap = function(child)
	{
		if ( this.parent )
		{
			this.parent.drawMap(child);
		}
		
		if ( this.getCollapse() && this != child || this == focusNode )
		{
			return;
		}
		
		var angleStart =
			(child.baseMagnitude - this.baseMagnitude) / this.magnitude * Math.PI * 2 +
			rotationOffset;
		var angleEnd =
			(child.baseMagnitude - this.baseMagnitude + child.magnitude) /
			this.magnitude * Math.PI * 2 +
			rotationOffset;
		
		var box = this.getMapPosition();
		
		context.save();
		context.fillStyle = 'black';
		context.textAlign = 'end';
		context.textBaseline = 'middle';
		
		if ( this == child )
		{
			context.font = fontBold;
			context.fillText(this.name, box.x, box.y);
			context.font = fontNormal;
		}
		else
		{
			var textX = box.x - mapRadius - mapBuffer;
			var percentage = getPercentage(child.magnitude / this.magnitude);
			
			if ( this == selectedNode )
			{
				context.font = fontBold;
			}
			
			context.fillText(percentage + '% of', textX, box.y - mapRadius / 3);
			context.fillText(this.name, textX, box.y + mapRadius / 3);
			
			if ( this == highlightedNode && this != selectedNode )
			{
				context.fillStyle = 'rgb(245, 245, 245)';
	//			context.fillStyle = 'rgb(200, 200, 200)';
			}
			else
			{
				context.fillStyle = 'rgb(255, 255, 255)';
			}
			
			context.beginPath();
			context.arc(box.x, box.y, mapRadius, 0, Math.PI * 2, true);
			context.closePath();
			context.fill();
			
			if ( this == selectedNode )
			{
				context.lineWidth = 1;
				context.fillStyle = 'rgb(100, 100, 100)';
			}
			else
			{
				if ( this == highlightedNode )
				{
					context.lineWidth = .2;
					context.fillStyle = 'rgb(190, 190, 190)';
				}
				else
				{
					context.lineWidth = .2;
					context.fillStyle = 'rgb(200, 200, 200)';
				}
			}
			
			context.stroke();
			context.beginPath();
			context.moveTo(box.x, box.y);
			context.arc(box.x, box.y, mapRadius, angleStart, angleEnd, false);
			context.closePath();
			context.fill();
			
			if ( this == highlightedNode && this != selectedNode )
			{
				context.lineWidth = 1;
				context.stroke();
			}
		}
		
		context.restore();
	}
	
	this.drawReferenceRings = function()
	{
		if ( snapshotMode )
		{
			svg +=
				'<circle cx="' + centerX + '" cy="' + centerY +
				'" r="' + nodeRadius * gRadius + '"/>';
			svg +=
				'<circle cx="' + centerX + '" cy="' + centerY +
				'" r="' + gRadius + '"/>';
		}
		else
		{
			var childRadiusInner = this.children[0].getUncollapsed().radiusInner.current();
			
			context.globalAlpha = 1 - this.alphaLine.current();//this.getUncollapsed().alphaLine.current();
			context.beginPath();
			context.arc(0, 0, childRadiusInner * gRadius, 0, Math.PI * 2, false);
			context.stroke();
			context.beginPath();
			context.arc(0, 0, gRadius, 0, Math.PI * 2, false);
			context.stroke();
		}
	}
	
	this.drawSearchHighlights = function(label, labelLength, bubbleX, bubbleY, rotation, center)
	{
		var index = -1;
		
		bubbleX -= fontSize / 4;
		
		do
		{
			index = label.toLowerCase().indexOf(search.value.toLowerCase(), index + 1);
			
			if ( index != -1 && index < labelLength )
			{
				var dim = context.measureText(label.substr(0, index));
				var x = bubbleX + dim.width;
				
				dim = context.measureText(label.substr(index, search.value.length));
				
				var y = bubbleY - fontSize * 3 / 4;
				var width = dim.width + fontSize / 2;
				var height = fontSize * 3 / 2;
				var radius = fontSize / 2;
				
				if ( snapshotMode )
				{
					if ( center )
					{
						x += centerX;
						y += centerY;
					}
					
					svg +=
						'<rect x="' + x + '" y="' + y +
						'" width="' + width +
						'" height="' + height +
						'" rx="' + radius +
						'" ry="' + radius +
						'" fill="rgb(255, 255, 100)' +
						'" transform="rotate(' +
						degrees(rotation) + ',' + centerX + ',' + centerY +
						')"/>';
				}
				else
				{
					context.fillStyle = 'rgb(255, 255, 100)';
					context.rotate(rotation);
					roundedRectangle(x, y, width, height, radius);
					context.fill();
					context.rotate(-rotation);
				}
			}
		}
		while ( index != -1 && index < labelLength );
	}
	
	this.drawTextFlipped = function(text, innerText, angle, radius, radial, highlightAlpha, addResults, highlightSearch)
	{
		var anchor;
		var textX;
		var textY;
		var spacer;
		var totalText = text;
		var flip;
		
		if ( snapshotMode )
		{
			spacer = '&#160;&#160;&#160;';
		}
		else
		{
			spacer = '   ';
		}
		
		if ( radial )
		{
			flip = angle < 3 * Math.PI / 2;
			
			if ( flip )
			{
				angle -= Math.PI;
				radius = -radius;
				anchor = 'end';
				
				if ( innerText )
				{
					totalText = text + spacer + innerText;
				}
			}
			else
			{
				anchor = 'start';
				
				if ( innerText )
				{
					totalText = innerText + spacer + text;
				}
			}
			
			textX = radius;
			textY = 0;
		}
		else
		{
			flip = angle < Math.PI || angle > 2 * Math.PI;
			var label;
			
			anchor = snapshotMode ? 'middle' : 'center';
			
			if ( flip )
			{
				angle -= Math.PI;
				radius = -radius;
			}
			
			angle += Math.PI / 2;
			textX = 0;
			textY = -radius;
		}
		
		//if ( highlight )
		{
		//	text += ' ' + angle;
		}
		
		if ( highlightAlpha )
		{
			var textActual = totalText;
			
			if ( innerText && snapshotMode )
			{
				if ( flip )
				{
					textActual = text + '   ' + innerText;
				}
				else
				{
					textActual = innerText + '   ' + text;
				}
			}
			
			var labelLength = textActual.length;
			
			if ( addResults )
			{
				textActual = this.addSearchResultString(textActual);
			}
			
			dim = context.measureText(textActual);
			
			var x = textX;
			
			if ( anchor == 'end' )
			{
				x -= dim.width;
			}
			else if ( anchor != 'start' )
			{
				// centered
				x -= dim.width / 2;
			}
			
			drawBubble(angle, radius, dim.width, radial, flip);
			
			if ( this.searchResult && highlightSearch )
			{
				this.drawSearchHighlights
				(
					textActual,
					labelLength,
					x,
					textY,
					angle,
					true
				)
			}
		}
		
		if ( addResults )
		{
			totalText = this.addSearchResultString(totalText);
		}
		
		drawText(totalText, textX, textY, angle, anchor);
		
		return flip;
	}
	
	this.getCollapse = function()
	{
		return (
			collapse &&
			this.collapse &&
			this.depth != maxAbsoluteDepth
			);
	}
	
	this.getDepth = function()
	{
		if ( collapse )
		{
			return this.depthCollapsed;
		}
		else
		{
			return this.depth;
		}
	}
	
	this.getMapPosition = function()
	{
		return {
			x : (details.offsetLeft + details.clientWidth - mapRadius),
			y : ((focusNode.getDepth() - this.getDepth()) *
				(mapBuffer + mapRadius * 2) - mapRadius) +
				details.clientHeight + details.offsetTop
		};
	}
	
	this.getNodeByID = function(id)
	{
		if ( this.nodeID == id )
		{
			return this;
		}
		else
		{
			var node = null;
			
			for (var i = 0; i < this.children.length; i++)
			{
				node = this.children[i].getNodeByID(id);
				
				if ( node != null )
				{
					break;
				}
			}
			
			return node;
		}
	}
	
	this.getParent = function()
	{
		// returns parent, accounting for collapsing or 0 if doesn't exist
		
		var parent = this.parent;
		
		while ( parent != 0 && parent.getCollapse() )
		{
			parent = parent.parent;
		}
		
		return parent;
	}
	
	this.getPercentage = function()
	{
		return getPercentage(this.magnitude / selectedNode.magnitude);
	}
	
	this.getUncollapsed = function()
	{
		// recurs through collapsed children until uncollapsed node is found
		
		if ( this.getCollapse() )
		{
			return this.children[0].getUncollapsed();
		}
		else
		{
			return this;
		}
	}
	
	this.hasChildren = function()
	{
		return this.children.length && this.depth < maxAbsoluteDepth;
	}
	
	this.hasParent = function(parent)
	{
		if ( this.parent )
		{
			if ( this.parent == parent )
			{
				return true;
			}
			else
			{
				return this.parent.hasParent(parent);
			}
		}
		else
		{
			return false;
		}
	}
	
	this.maxDepth = function()
	{
		var currentMaxDepth = 0;
		
		//if ( this.canDisplayDepth() )
		{
			for ( i in this.children )
			{
				var currentDepth = this.children[i].maxDepth();
				
				if ( currentDepth > currentMaxDepth )
				{
					currentMaxDepth = currentDepth;
				}
			}
			
			//if ( !this.getCollapse() )
			{
				currentMaxDepth++;
			}
		}
		
		return currentMaxDepth;
	}
	
	this.maxVisibleDepth = function(depth, maxDepth)
	{
		var currentMaxDepth = 0;
		var childInnerRadius = depth / maxDepth;
		
		if ( this.canDisplayDepth() )
		{
			if ( this.getCollapse() )
			{
				depth++;
			}
			
			for ( i in this.children )
			{
				if
				(//true ||
					this.children[i].magnitude *
					angleFactor *
					(childInnerRadius + 1) *
					gRadius >=
					minWidth()
				)
				{
					var currentDepth = this.children[i].maxVisibleDepth(depth, maxDepth);
					
					if ( currentDepth > currentMaxDepth )
					{
						currentMaxDepth = currentDepth;
					}
				}
			}
			
			if ( !this.getCollapse() )
			{
				currentMaxDepth++;
			}
		}
		
		return currentMaxDepth;
	}
	
	this.resetLabelWidth = function()
	{
		var nameWidthOld = this.nameWidth;
		
		if ( ! this.radial )//&& fontSize != fontSizeLast )
		{
			context.font = fontNormal;
			var dim = context.measureText(this.name);
			this.nameWidth = dim.width;
		}
		
		if ( fontSize != fontSizeLast && this.labelWidth.end == nameWidthOld * labelWidthFudge )
		{
			// font size changed; adjust start of tween to match
			
			this.labelWidth.start = this.nameWidth * labelWidthFudge;
		}
		else
		{
			this.labelWidth.start = this.labelWidth.current();
		}
		
		this.labelWidth.end = this.nameWidth * labelWidthFudge;
	}
	
	this.restrictLabelWidth = function(width)
	{
		if ( width < this.labelWidth.end )
		{
			this.labelWidth.end = width;
		}
	}
	
	this.search = function()
	{
		this.searchResult = false;
		this.containsSearchResult = 0;
		
		if
		(
			! this.getCollapse() &&
			search.value != '' &&
			this.name.toLowerCase().indexOf(search.value.toLowerCase()) != -1
		)
		{
			this.searchResult = true;
			this.containsSearchResult = 1;
			nSearchResults++;
		}
		
		for ( var i = 0; i < this.children.length; i++ )
		{
			this.containsSearchResult += this.children[i].search();
		}
		
		return this.containsSearchResult;
	}
	
	this.setBaseMagnitude = function(baseMagnitude)
	{
		this.baseMagnitude = baseMagnitude;
		
		for ( var i = 0; i < this.children.length; i++ )
		{
			this.children[i].setBaseMagnitude(baseMagnitude);
			baseMagnitude += this.children[i].magnitude;
		}
		
		this.maxChildMagnitude = baseMagnitude;
	}
	
	this.setDepth = function(depth, depthCollapsed)
	{
		this.depth = depth;
		this.depthCollapsed = depthCollapsed;
		
		if
		(
			this.children.length == 1 &&
			this.children[0].magnitude == this.magnitude
		)
		{
			this.collapse = true;
		}
		else
		{
			this.collapse = false;
			depthCollapsed++;
		}
		
		for ( var i = 0; i < this.children.length; i++ )
		{
			this.children[i].setDepth(depth + 1, depthCollapsed);
		}
	}
	
	this.setHighlightStyle = function()
	{
		context.lineWidth = highlightLineWidth;
		
		if ( this.hasChildren() || this != focusNode || this != highlightedNode )
		{
			context.strokeStyle = 'black';
			context.fillStyle = "rgba(255, 255, 255, .3)";
		}
		else
		{
			context.strokeStyle = 'rgb(90,90,90)';
			context.fillStyle = "rgba(155, 155, 155, .3)";
		}
	}
	
	this.setLabelWidth = function(node)
	{
		if ( ! shorten || this.radial )
		{
			return; // don't need to set width
		}
		
		if ( ! node.canDisplayLabel() )
		{
			return;
		}
		
		var angle = (this.angleStart.end + this.angleEnd.end) / 2;
		var a = Math.abs(angle - (node.angleStart.end + node.angleEnd.end) / 2); // angle difference
		
		if ( node.radial )
		{
			if ( a > Math.PI )
			{
				a = 2 * Math.PI - a;
			}
			
			if ( a < Math.PI / 2 )
			{
				var r = this.labelRadius.end * gRadius - .5 * fontSize
				var hypotenuse = r / Math.cos(a);
				var opposite = r * Math.tan(a);
				
				if
				(
					node.labelRadius.end * gRadius - fontSize < hypotenuse &&
					this.labelWidth.end / 2 + .75 * fontSize > opposite
				)
				{
					this.labelWidth.end = opposite * 2 - 1.5 * fontSize;
				}
			}
		}
		else
		{
			// different tracks; find intersection and shorten one if needed
			
			if ( a > Math.PI )
			{
				a = 2 * Math.PI - a;
			}
			
			var r1;
			var r2;
			
			var fontFudge = .35 * fontSize;
			
			r1 = this.labelRadius.end * gRadius;
			r2 = node.labelRadius.end * gRadius;
			
			// first adjust the radii to account for the height of the font by shifting them
			// toward each other
			//
			if ( this.labelRadius.end < node.labelRadius.end )
			{
				r1 += fontFudge;
				r2 -= fontFudge;
			}
			else if ( this.labelRadius.end > node.labelRadius.end )
			{
				r1 -= fontFudge;
				r2 += fontFudge;
			}
			else
			{
				r1 -= fontFudge;
				r2 -= fontFudge;
			}
			
			var r1s = r1 * r1;
			var r2s = r2 * r2;
			
			// distance between the centers of the two labels
			//
			var dist = Math.sqrt(r1s + r2s - 2 * r1 * r2 * Math.cos(a));
			
			// angle at our label center between our radius and the line to the other label center
			//
			var b = Math.acos((r1s + dist * dist - r2s) / (2 * r1 * dist));
			
			// distance from our label center to the intersection of the two tangents
			//
			var l1 = Math.abs(Math.sin(a + b - Math.PI / 2) * dist / Math.sin(Math.PI - a)) - .4 * fontSize;
			
			// distance from other label center the the intersection of the two tangents
			//
			var l2 = Math.abs(Math.sin(Math.PI / 2 - b) * dist / Math.sin(Math.PI - a)) - .4 * fontSize;
			
			if ( this.labelWidth.end / 2 > l1 && node.labelWidth.end / 2 > l2 )
			{
				// intersection
				
				if ( r1 == r2 )
				{
					this.restrictLabelWidth(2 * l1);
					node.restrictLabelWidth(2 * l2);
				}
				else
				{
					if ( l1 > l2 )
					{
						this.restrictLabelWidth(2 * l1);
					}
					else
					{
						node.restrictLabelWidth(2 * l2);
					}
				}
			}
		}
	}
	
	this.setTargets = function(hueMin, hueMax)
	{
		var depthRelative = this.getDepth() - selectedNode.getDepth();
		var parentOfSelected =
		(
//			! this.getCollapse() &&
			this.baseMagnitude <= selectedNode.baseMagnitude &&
			this.baseMagnitude + this.magnitude >=
			selectedNode.baseMagnitude + selectedNode.magnitude
		);
		
		if ( this == selectedNode || parentOfSelected )
		{
			this.resetLabelWidth();
		}
		else
		{
			context.font = fontNormal;
			var dim = context.measureText(this.name);
			this.nameWidth = dim.width;
			this.labelWidth.setTarget(this.labelWidth.end);
		}
		
		if ( this == selectedNode )
		{
//			if ( relativeColorCheckBox.checked )
			{
				// reset hue min and max to use the full color spectrum
				// for the selected node
				
				hueMin = 0;
				hueMax = 1;
			}
			
			for ( var i = 0; i < this.children.length; i++ )
			{
				this.children[i].setTargetsSelected
				(
					hueMin + i * (hueMax - hueMin) / this.children.length,
					hueMin + (i + 1) * (hueMax - hueMin) / this.children.length,
					false
				);
			}
			
			this.labelWidth.setTarget(this.nameWidth * labelWidthFudge);
		}
		else
		{
			for ( var i = 0; i < this.children.length; i++ )
			{
				this.children[i].setTargets
				(
					hueMin + i * (hueMax - hueMin) / this.children.length,
					hueMin + (i + 1) * (hueMax - hueMin) / this.children.length
				);
			}
		}
		
		if ( this.getDepth() <= selectedNode.getDepth() )
		{
			// collapse in
			
			this.radiusInner.setTarget(0);
			this.alphaLine.setTarget(0);
			
			if ( parentOfSelected )
			{
				this.labelRadius.setTarget
				(
					(this.getDepth() - selectedNode.getDepth()) *
					historySpacingFactor * fontSize / gRadius
				);
				this.scale.setTarget(1 - (selectedNode.getDepth() - this.getDepth()) / 18); // TEMP
			}
			else
			{
				this.labelRadius.setTarget(0);
				this.scale.setTarget(1); // TEMP
			}
		}
		else if ( nodeRadius * depthRelative > 1 )
		{
			// collapse out
			
			this.radiusInner.setTarget(1);
			this.alphaLine.setTarget(0);
			this.labelRadius.setTarget(1);
			this.scale.setTarget(1); // TEMP
		}
		else
		{
			// don't collapse
			
			this.radiusInner.setTarget(nodeRadius * (depthRelative));
			this.alphaLine.setTarget(0);
			this.scale.setTarget(1); // TEMP
			
			if ( this == selectedNode )
			{
				this.labelRadius.setTarget(0);
			}
			else
			{
				this.labelRadius.setTarget(nodeRadius * (depthRelative) + nodeRadius / 2);
			}
		}
		
		this.r.setTarget(255);
		this.g.setTarget(255);
		this.b.setTarget(255);
		this.alphaWedge.setTarget(0);
		
		if ( this == selectedNode )
		{
			this.alphaLabel.setTarget(1);
			this.radial = false;
		}
		else if ( parentOfSelected && ! this.getCollapse() )
		{
			var alpha =
			(
				1 -
				(selectedNode.getDepth() - this.getDepth()) /
				(Math.floor(nodeRadius * gRadius / (historySpacingFactor * fontSize) - .5) + 1)
			);
			
			if ( alpha < 0 )
			{
				//alpha = 0;
			}
			
			this.alphaLabel.setTarget(alpha);
			this.radial = false;
		}
		else
		{
			this.alphaLabel.setTarget(0);
		}
		
		if ( this.baseMagnitude <= selectedNode.baseMagnitude )
		{
			this.angleStart.setTarget(0);
		}
		else
		{
			this.angleStart.setTarget(Math.PI * 2);
		}
		
		if
		(
			this.baseMagnitude + this.magnitude >=
			selectedNode.baseMagnitude + selectedNode.magnitude
		)
		{
			this.angleEnd.setTarget(Math.PI * 2);
		}
		else
		{
			this.angleEnd.setTarget(0);
		}
	}
	
	this.setTargetsSelected = function(hueMin, hueMax, focused)
	{
		var collapse = this.getCollapse();
		var depth = this.getDepth() - selectedNode.getDepth() + 1;
		var canDisplayChildren = false;
		
		if ( this == focusNode )
		{
			focused = true;
		}
		
		if ( hueMax - hueMin > 1 / 6 )
		{
			hueMax = hueMin + 1 / 6;
		}
		
		for ( var i = 0; i < this.children.length; i++ )
		{
			this.children[i].setTargetsSelected
			(
				hueMin + i * (hueMax - hueMin) / this.children.length,
				hueMin + (i + 1) * (hueMax - hueMin) / this.children.length,
				focused
			);
			
			if ( this.children[i].canDisplayLabel() )
			{
				canDisplayChildren = true;
			}
		}
		
		var baseMagnitudeRelative = this.baseMagnitude - selectedNode.baseMagnitude;
		
		this.angleStart.setTarget(baseMagnitudeRelative * angleFactor);
		this.angleEnd.setTarget((baseMagnitudeRelative + this.magnitude) * angleFactor);
	 	
	 	var hue;
	 	
	 	if ( false && useHue() && this.hue == null )
	 	{
			this.r.setTarget(240);
			this.g.setTarget(240);
			this.b.setTarget(240);
	 	}
	 	else
	 	{
			var lightness;
			
			if ( this.hue == null || ! useHue.checked )
			{
				lightness = lightnessBase + (depth - 1) * lightnessFactor;
				
				if ( lightness > lightnessMax )
				{
					lightness = lightnessMax;
				}
			}
			else
			{
				lightness = (lightnessBase + lightnessMax) / 2;
			}
			
			var rgb = hslToRgb
			(
				false && useHue() ? this.hue : hueMin,// TEMP
				saturation,
				lightness
			);
			
			this.r.setTarget(rgb.r);
			this.g.setTarget(rgb.g);
			this.b.setTarget(rgb.b);
			this.alphaWedge.setTarget(1);
		}
		
		this.scale.setTarget(1); // TEMP
		
		if ( depth > maxDisplayDepth || ! this.canDisplayDepth() )
		{
//			this.radiusInner.setTarget(1 + (depth - maxDisplayDepth) * .01);
			this.radiusInner.setTarget(1);
			
			this.alphaLabel.setTarget(0);
			this.alphaLine.setTarget(0);
		}
		else
		{
			this.radiusInner.setTarget(nodeRadius * (depth - 1));
			
			if ( collapse )
			{
				this.alphaLabel.setTarget(0);
				this.alphaLine.setTarget(0);
			}
			else
			{
				this.alphaLabel.setTarget(1);
				this.alphaLine.setTarget(1);
			}
		}
		
		// TEMP
		//
		if ( focused )
		{
			this.radiusOuter.setTarget(1.1);
		}
		else
		{
			this.radiusOuter.setTarget(1);
		}
		
		var canDisplayLabel = this.canDisplayLabel();
		
		// set radial
		//
		if
		(
			! collapse &&
			canDisplayLabel &&
			depth <= maxDisplayDepth &&
			this.canDisplayDepth() ||
			depth == 2 ||
			! canDisplayChildren && canDisplayLabel
		)
		{
			this.radial = true;
			
			if ( ! canDisplayLabel && ! collapse && depth == 2 && this.canDisplayDepth() )
			{
				keys++;
			}
			
			if ( canDisplayLabel || collapse )
			{
				if ( depth != maxDisplayDepth && this.depth != maxAbsoluteDepth )
				{
					for ( var i in this.children )
					{
						// if we are going to display any children, the text
						// should be tangential; otherwise, radial
						
						if ( this.children[i].canDisplayLabel() )
						{
							this.radial = false;
						}
					}
				}
			}
		}
		
		this.resetLabelWidth();
		
		// set labelRadius target
		//
		if ( collapse )
		{
			this.labelRadius.setTarget(this.radiusInner.end);
		}
		else
		{
			if ( depth > maxDisplayDepth || ! this.canDisplayDepth() )
			{
				this.labelRadius.setTarget(1);
			}
			else
			{
				var labelOffset = labelOffsets[depth];
				
				if ( this.radial )
				{
					this.labelRadius.setTarget((this.radiusInner.end + 1) / 2);
				}
				else
				{
					var radiusCenter =
						nodeRadius * (depth - 1) +
						nodeRadius / 2;
					
					this.labelRadius.setTarget
					(
						radiusCenter + ((labelOffset + 1) / (nLabelOffsets + 1) - .5) * nodeRadius
					);
				}
				
				if ( canDisplayLabel )
				{
					// check last and first labels in each track for overlap
					
					for ( var i = 2; i <= maxDisplayDepth; i++ )
					{
						for ( var j = 0; j <= nLabelOffsets; j++ )
						{
							var last = labelLastNodes[i][j];
							var first = labelFirstNodes[i][j];
							
							if ( last )
							{
								if ( j == nLabelOffsets )
								{
									// last is radial
									this.setLabelWidth(last);
								}
								else
								{
									last.setLabelWidth(this);
								}
							}
							
							if ( first )
							{
								if ( j == nLabelOffsets )
								{
									this.setLabelWidth(first);
								}
								else
								{
									first.setLabelWidth(this);
								}
							}
						}
					}
					
					if ( ! this.radial )
					{
						labelLastNodes[depth][labelOffset] = this;
						
						// update offset
						
						labelOffsets[depth]++;
						
						if ( labelOffsets[depth] == nLabelOffsets )
						{
							labelOffsets[depth] = 0;
						}
						
						if ( labelFirstNodes[depth][labelOffset] == 0 )
						{
							labelFirstNodes[depth][labelOffset] = this;
						}
					}
					else
					{
						// use the last 'track' of this depth for radial
						
						labelLastNodes[depth][nLabelOffsets] = this;
						
						if ( labelFirstNodes[depth][nLabelOffsets] == 0 )
						{
							labelFirstNodes[depth][nLabelOffsets] = this;
						}
					}
				}
				else
				{
					this.labelWidth.end = 0;
				}
			}
		}
	}
	
	this.shortenLabel = function()
	{
		var label = this.name;
		
		var labelWidth = this.nameWidth;
		var maxWidth = this.labelWidth.current();
		var minEndLength = 0;
		
		if ( labelWidth > maxWidth && label.length > minEndLength * 2 )
		{
			var endLength =
				Math.floor((label.length - 1) * maxWidth / labelWidth / 2);
			
			if ( endLength < minEndLength )
			{
				endLength = minEndLength;
			}
			
			return (
				label.substring(0, endLength) +
				'...' +
				label.substring(label.length - endLength));
		}
		else
		{
			return label;
		}
	}
	
	this.shouldAddSearchResultsString = function()
	{
		if ( this.searchResult )
		{
			return this.containsSearchResult > 1;
		}
		else
		{
			return this.containsSearchResult > 0;
		}
	}
	
	this.sort = function()
	{
		this.children.sort(function(a, b){return b.magnitude - a.magnitude});
		
		for (var i = 0; i < this.children.length; i++)
		{
			this.children[i].sort();
		}
	}
	
	this.update = function()
	{
	}
}

function addOptionElements()
{
	document.getElementById('details').style.fontSize = '9pt';
	document.getElementById('details').innerHTML = '\
<span id="detailsName" style="font-weight:bold"></span>&nbsp;\
<input type="button" id="detailsExpand" onclick="expand(focusNode);"\
value="&harr;" title="Expand this wedge to become the new focus of the chart"/><br/>\
<div id="detailsInfo" style="float:right"></div>\
';
	document.getElementById('options').style.fontSize = '9pt';
	document.getElementById('options').innerHTML ='\
&nbsp;<input type="button" id="back" value="&larr;" title="Go back"/>\
<input type="button" id="up" value="&uarr;" title="Go up to parent"/>\
<input type="button" id="forward" value="&rarr;" title="Go forward"/> \
&nbsp;Search: <input type="text" id="search"/>\
<input type="button" value="x" onclick="clearSearch()"/> \
<span id="searchResults"></span><br/>\
&nbsp;<div title="Maximum depth to display, counted from &quot;all&quot; and \
including collapsed nodes.">\
&nbsp;<input type="button" id="maxAbsoluteDepthDecrease" value="-"/>\
<span id="maxAbsoluteDepth"></span>\
&nbsp;<input type="button" id="maxAbsoluteDepthIncrease" value="+"/> max depth\
</div>\
<div title="Collapse nodes that are entirely composed of one child by \
displaying that child in their place">\
&nbsp;<input type="checkbox" id="collapse" checked="checked" />collapse\
</div>\
<br/>&nbsp;<input type="button" id="fontSizeDecrease" value="-"/>\
<span id="fontSize"></span>\
&nbsp;<input type="button" id="fontSizeIncrease" value="+"/> font size\
<div title="Prevent labels from overlapping by shortening them">\
&nbsp;<input type="checkbox" id="shorten" checked="checked" />shorten labels</div>\
<div id="useHueDiv">\
</div>\
<br/>&nbsp;<input type="button" id="snapshot" value="snapshot" \
title="Render the current view as SVG (Scalable Vector Graphics), a publication-\
quality format that can be printed and saved (see Help for browser compatibility">\
<br/><br/>&nbsp;<input type="button" id="help" value="?"\
onclick="window.open(\'https://sourceforge.net/p/krona/wiki/Browsing%20Krona%20charts/\', \'help\')"/>\
';
}

function arrow(angleStart, angleEnd, radiusInner)
{
	if ( context.globalAlpha == 0 )
	{
		return;
	}
	
	var angleCenter = (angleStart + angleEnd) / 2;
	var radiusArrowInner = radiusInner - gRadius / 10;//nodeRadius * gRadius;
	var radiusArrowOuter = gRadius * 1.1;//(1 + nodeRadius);
	var radiusArrowCenter = (radiusArrowInner + radiusArrowOuter) / 2;
	var pointLength = (radiusArrowOuter - radiusArrowInner) / 5;
	
	// First, mask out the first half of the arrow.  This will prevent the tips
	// from superimposing if the arrow goes most of the way around the circle.
	// Masking is done by setting the clipping region to the inverse of the
	// half-arrow, which is defined by cutting the half-arrow out of a large
	// rectangle
	//
	context.beginPath();
	context.arc(0, 0, radiusInner, angleCenter, angleEnd, false);
	context.lineTo
	(
		radiusArrowInner * Math.cos(angleEnd),
		radiusArrowInner * Math.sin(angleEnd)
	);
	context.lineTo
	(
		radiusArrowCenter * Math.cos(angleEnd) - pointLength * Math.sin(angleEnd),
		radiusArrowCenter * Math.sin(angleEnd) + pointLength * Math.cos(angleEnd)
	);
	context.lineTo
	(
		radiusArrowOuter * Math.cos(angleEnd),
		radiusArrowOuter * Math.sin(angleEnd)
	);
	context.arc(0, 0, gRadius, angleEnd, angleCenter, true);
	context.closePath();
	context.moveTo(-imageWidth, -imageHeight);
	context.lineTo(imageWidth, -imageHeight);
	context.lineTo(imageWidth, imageHeight);
	context.lineTo(-imageWidth, imageHeight);
	context.closePath();
	context.save();
	context.clip();
	
	// Next, draw the other half-arrow with the first half masked out
	//
	context.beginPath();
	context.arc(0, 0, radiusInner, angleCenter, angleStart, true);
	context.lineTo
	(
		radiusArrowInner * Math.cos(angleStart),
		radiusArrowInner * Math.sin(angleStart)
	);
	context.lineTo
	(
		radiusArrowCenter * Math.cos(angleStart) + pointLength * Math.sin(angleStart),
		radiusArrowCenter * Math.sin(angleStart) - pointLength * Math.cos(angleStart)
	);
	context.lineTo
	(
		radiusArrowOuter * Math.cos(angleStart),
		radiusArrowOuter * Math.sin(angleStart)
	);
	context.arc(0, 0, gRadius, angleStart, angleCenter, false);
	context.fill();
	context.stroke();
	
	// Finally, remove the clipping region and draw the first half-arrow.  This
	// half is extended slightly to fill the seam.
	//
	context.restore();
	context.beginPath();
	context.arc(0, 0, radiusInner, angleCenter - 2 / (2 * Math.PI * radiusInner), angleEnd, false);
	context.lineTo
	(
		radiusArrowInner * Math.cos(angleEnd),
		radiusArrowInner * Math.sin(angleEnd)
	);
	context.lineTo
	(
		radiusArrowCenter * Math.cos(angleEnd) - pointLength * Math.sin(angleEnd),
		radiusArrowCenter * Math.sin(angleEnd) + pointLength * Math.cos(angleEnd)
	);
	context.lineTo
	(
		radiusArrowOuter * Math.cos(angleEnd),
		radiusArrowOuter * Math.sin(angleEnd)
	);
	context.arc(0, 0, gRadius, angleEnd, angleCenter - 2 / (2 * Math.PI * gRadius), true);
	context.fill();
	context.stroke();
}

function attributeIndex(name)
{
	for ( var i = 0 ; i < attributeNames.length; i++ )
	{
		if ( name == attributeNames[i] )
		{
			return i;
		}
	}
	
	return null;
}

function checkHighlight()
{
	var lastHighlightedNode = highlightedNode;
	var lastHighlightingHidden = highlightingHidden;
	
	highlightedNode = selectedNode;
	resetKeyOffset();
	
	if ( progress == 1 )
	{
		selectedNode.checkHighlight();
		if ( selectedNode.getParent() )
		{
			selectedNode.getParent().checkHighlightCenter();
		}
		
		focusNode.checkHighlightMap();
	}
	
	if ( highlightedNode != selectedNode )
	{
		if ( highlightedNode == focusNode )
		{
//			canvas.style.display='none';
//			window.resizeBy(1,0);
//			canvas.style.cursor='ew-resize';
//			window.resizeBy(-1,0);
//			canvas.style.display='inline';
		}
		else
		{
//			canvas.style.cursor='pointer';
		}
	}
	else
	{
//		canvas.style.cursor='auto';
	}
	
	if
	(
		(
			true ||
			highlightedNode != lastHighlightedNode ||
			highlightingHidden != highlightingHiddenLast
		) &&
		progress == 1
	)
	{
		draw(); // TODO: handle in update()
	}
}

function checkSelectedCollapse()
{
	var newNode = selectedNode;
	
	while ( newNode.getCollapse() )
	{
		newNode = newNode.children[0];
	}
	
	if ( newNode.children.length == 0 )
	{
		newNode = newNode.getParent();
	}
	
	if ( newNode != selectedNode )
	{
		selectNode(newNode);
	}
}

function clearSearch()
{
	search.value = '';
	onSearchChange();
}

function createSVG()
{
	svgNS = "http://www.w3.org/2000/svg";
	var SVG = {};
	SVG.xlinkns = "http://www.w3.org/1999/xlink";
	
	var newSVG = document.createElementNS(svgNS, "svg:svg");
	
	newSVG.setAttribute("id", "canvas");
	// How big is the canvas in pixels
	newSVG.setAttribute("width", '100%');
	newSVG.setAttribute("height", '100%');
	// Set the coordinates used by drawings in the canvas
//	newSVG.setAttribute("viewBox", "0 0 " + imageWidth + " " + imageHeight);
	// Define the XLink namespace that SVG uses
	newSVG.setAttributeNS
	(
		"http://www.w3.org/2000/xmlns/",
		"xmlns:xlink",
		SVG.xlinkns
	);
	
	return newSVG;
}

function degrees(radians)
{
	return radians * 180 / Math.PI;
}

function draw()
{
	tweenFrames++;
	//resize();
//	context.fillRect(0, 0, imageWidth, imageHeight);
	context.clearRect(0, 0, imageWidth, imageHeight);
	
	context.font = fontNormal;
	context.textBaseline = 'middle';
	
	//context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
	context.translate(centerX, centerY);
	
	resetKeyOffset();
	
	head.draw(false, false); // draw pie slices
	head.draw(true, false); // draw labels
	
	var pathRoot = selectedNode;
	
	if ( focusNode != 0 && focusNode != selectedNode )
	{
		context.globalAlpha = 1;
		focusNode.drawHighlight();
		pathRoot = focusNode;
	}
	
	if
	(
		highlightedNode &&
		highlightedNode.getDepth() >= selectedNode.getDepth() &&
		highlightedNode != focusNode
	)
	{
		if
		(
			progress == 1 &&
			highlightedNode != selectedNode &&
			(
				highlightedNode != focusNode ||
				focusNode.children.length > 0
			)
		)
		{
			context.globalAlpha = 1;
			highlightedNode.drawHighlight();
		}
		
		//pathRoot = highlightedNode;
	}
	else if
	(
		progress == 1 &&
		highlightedNode.getDepth() < selectedNode.getDepth()
	)
	{
		context.globalAlpha = 1;
		highlightedNode.drawHighlightCenter();
	}
	
	if ( quickLook && false) // TEMP
	{
		context.globalAlpha = 1 - progress / 2;
		selectedNode.drawHighlight();
	}
	else if ( progress < 1 )//&& zoomOut() )
	{
		if ( !zoomOut)//() )
		{
			context.globalAlpha = selectedNode.alphaLine.current();
			selectedNode.drawHighlight();
		}
		else if ( selectedNodeLast )
		{
			context.globalAlpha = 1 - 4 * Math.pow(progress - .5, 2);
			selectedNodeLast.drawHighlight();
		}
	}
	
	//drawHistory();
	
	context.translate(-centerX, -centerY);
	context.globalAlpha = 1;
	
	mapRadius =
		(imageHeight / 2 - details.clientHeight - details.offsetTop) /
		(pathRoot.getDepth() - 1) * 3 / 4 / 2;
	
	if ( mapRadius > maxMapRadius )
	{
		mapRadius = maxMapRadius;
	}
	
	mapBuffer = mapRadius / 2;
	
	context.font = fontNormal;
	pathRoot.drawMap(pathRoot);
	
	if ( hueDisplayName && useHue() )
	{
		drawLegend();
	}
}

function drawBubble(angle, radius, width, radial, flip)
{
	var height = fontSize * 2;
	var x;
	var y;
	
	width = width + fontSize;
	
	if ( radial )
	{
		y = -fontSize;
		
		if ( flip )
		{
			x = radius - width + fontSize / 2;
		}
		else
		{
			x = radius - fontSize / 2;
		}
	}
	else
	{
		x = -width / 2;
		y = -radius - fontSize;
	}
	
	if ( snapshotMode )
	{
		drawBubbleSVG(x + centerX, y + centerY, width, height, fontSize, angle);
	}
	else
	{
		drawBubbleCanvas(x, y, width, height, fontSize, angle);
	}
}

function drawBubbleCanvas(x, y, width, height, radius, rotation)
{
	context.strokeStyle = 'black';
	context.lineWidth = highlightLineWidth;
	context.fillStyle = 'rgba(255, 255, 255, .75)';
	context.rotate(rotation);
	roundedRectangle(x, y, width, fontSize * 2, fontSize);
	context.fill();
	context.stroke();
	context.rotate(-rotation);
}

function drawBubbleSVG(x, y, width, height, radius, rotation)
{
	svg +=
		'<rect x="' + x + '" y="' + y +
		'" width="' + width +
		'" height="' + height +
		'" rx="' + radius +
		'" ry="' + radius +
		'" fill="rgba(255, 255, 255, .75)' +
		'" class="highlight" ' +
		'transform="rotate(' +
		degrees(rotation) + ',' + centerX + ',' + centerY +
		')"/>';
}

function drawHistory()
{
	var alpha = 1;
	context.textAlign = 'center';
	
	for ( var i = 0; i < nodeHistoryPosition && alpha > 0; i++ )
	{
		
		context.globalAlpha = alpha - historyAlphaDelta * tweenFactor;
		context.fillText
		(
			nodeHistory[nodeHistoryPosition - i - 1].name,
			0,
			(i + tweenFactor) * historySpacingFactor * fontSize - 1
		);
		
		if ( alpha > 0 )
		{
			alpha -= historyAlphaDelta;
		}
	}
	
	context.globalAlpha = 1;
}

function drawLegend()
{
	var left = imageWidth * .01;
	var width = imageHeight * .0265;
	var height = imageHeight * .15;
	var top = imageHeight - fontSize * 3.5 - height;
	var textLeft = left + width + fontSize / 2;
	
	context.fillStyle = 'black';
	context.textAlign = 'start';
//	context.fillText(valueStartText, textLeft, top + height);
//	context.fillText(valueEndText, textLeft, top);
	context.fillText(hueDisplayName, left, imageHeight - fontSize * 1.5);
	
	var gradient = context.createLinearGradient(0, top + height, 0, top);
	
	for ( var i = 0; i < hueStopPositions.length; i++ )
	{
		gradient.addColorStop(hueStopPositions[i], hueStopHsl[i]);
		
		var textY = top + (1 - hueStopPositions[i]) * height;
		
		if
		(
			i == 0 ||
			i == hueStopPositions.length - 1 ||
			textY > top + fontSize && textY < top + height - fontSize
		)
		{
			context.fillText(hueStopText[i], textLeft, textY);
		}
	}
	
	context.fillStyle = gradient;
	context.fillRect(left, top, width, height);
	context.lineWidth = thinLineWidth;
	context.strokeRect(left, top, width, height);
}

function drawLegendSVG()
{
	var left = imageWidth * .01;
	var width = imageHeight * .0265;
	var height = imageHeight * .15;
	var top = imageHeight - fontSize * 3.5 - height;
	var textLeft = left + width + fontSize / 2;

	var text = '';
	
	text += svgText(hueDisplayName, left, imageHeight - fontSize * 1.5);
	
	var svgtest = '<linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">';
	
	for ( var i = 0; i < hueStopPositions.length; i++ )
	{
		svgtest +=
			'<stop offset="' + round(hueStopPositions[i] * 100) +
			'%" style="stop-color:' + hueStopHsl[i] + '"/>';
		
		var textY = top + (1 - hueStopPositions[i]) * height;
		
		if
		(
			i == 0 ||
			i == hueStopPositions.length - 1 ||
			textY > top + fontSize && textY < top + height - fontSize
		)
		{
			text += svgText(hueStopText[i], textLeft, textY);
		}
	}
	
	svgtest += '</linearGradient>';
	//alert(svgtest);
	svg += svgtest;
	svg +=
		'<rect style="fill:url(#gradient)" x="' + left + '" y="' + top +
		'" width="' + width + '" height="' + height + '"/>';
	
	svg += text;
}

function drawText(text, x, y, angle, anchor)
{
	if ( snapshotMode )
	{
		svg +=
			'<text x="' + (centerX + x) + '" y="' + (centerY + y) +
			'" style=\'text-anchor:' + anchor + ';font:' + context.font +
			'\' transform="rotate(' + degrees(angle) + ',' + centerX + ',' + centerY + ')">' +
			text + '</text>';
	}
	else
	{
		context.fillStyle = 'black';
		context.textAlign = anchor;
		context.rotate(angle);
		context.fillText(text, x, y);
		context.rotate(-angle);
	}
}

function drawTick(start, length, angle)
{
	if ( snapshotMode )
	{
		svg +=
			'<line x1="' + (centerX + start) +
			'" y1="' + centerY +
			'" x2="' + (centerX + start + length) +
			'" y2="' + centerY +
			'" class="tick" transform="rotate(' +
			degrees(angle) + ',' + centerX + ',' + centerY +
			')"/>';
	}
	else
	{
		context.rotate(angle);
		context.beginPath();
		context.moveTo(start, 0);
		context.lineTo(start + length, 0);
		context.lineWidth = thinLineWidth * 2;
		context.stroke();
		context.rotate(-angle);
	}
}

function drawWedge
(
	angleStart,
	angleEnd,
	radiusInner,
	radiusOuter,
	color,
	patternAlpha,
	highlight
)
{
	if ( snapshotMode )
	{
		var longArc = angleEnd - angleStart > Math.PI ? 1 : 0;
		
		var x1 = centerX + radiusInner * Math.cos(angleStart);
		var y1 = centerY + radiusInner * Math.sin(angleStart);
		
		var x2 = centerX + gRadius * Math.cos(angleStart);
		var y2 = centerY + gRadius * Math.sin(angleStart);
		
		var x3 = centerX + gRadius * Math.cos(angleEnd);
		var y3 = centerY + gRadius * Math.sin(angleEnd);
		
		var x4 = centerX + radiusInner * Math.cos(angleEnd);
		var y4 = centerY + radiusInner * Math.sin(angleEnd);
		
		var dArray =
		[
			" M ", x1, ",", y1,
			" L ", x2, ",", y2,
			" A ", gRadius, ",", gRadius, " 0 ", longArc, ",1 ", x3, ",", y3,
			" L ", x4, ",", y4,
			" A ", radiusInner, ",", radiusInner, " 0 ", longArc, " 0 ", x1, ",", y1,
			" Z "
		];
		
		svg +=
			'<path class="'+ (highlight ? 'highlight' : 'wedge') + '" fill="' + color +
			'" d="' + dArray.join('') + '"/>';
		
		if ( patternAlpha > 0 )
		{
			svg +=
				'<path class="wedge" fill="url(#hiddenPattern)" d="' +
				dArray.join('') + '"/>';
		}
	}
	else
	{
		context.fillStyle = color;
		context.beginPath();
		context.arc(0, 0, radiusInner, angleStart, angleEnd, false);
		context.arc(0, 0, radiusOuter, angleEnd, angleStart, true);
		context.closePath();
		context.fill();
		
		if ( patternAlpha > 0 )
		{
			context.save();
			context.clip();
			context.globalAlpha = patternAlpha;
			context.fillStyle = hiddenPattern;
			context.fill();
			context.restore();
		}
	}
}

function expand(node)
{
	selectNode(node);
	updateView();
}

function focusLost()
{
	mouseX = -1;
	mouseY = -1;
	checkHighlight();
	document.body.style.cursor = 'auto';
}

function fontSizeDecrease()
{
	if ( fontSize > 1 )
	{
		fontSize--;
		updateViewNeeded = true;
	}
}

function fontSizeIncrease()
{
	fontSize++;
	updateViewNeeded = true;
}

function getPercentage(fraction)
{
	return round(fraction * 100);
}

function hslText(hue)
{
	var hslArray =
	[
		'hsl(',
		Math.floor(hue * 360),
		',',
		Math.floor(saturation * 100),
		'%,',
		Math.floor((lightnessBase + lightnessMax) * 50),
		'%)'
	];
	
	return hslArray.join('');
}

function hslToRgb(h, s, l)
{
	var m1, m2;
	var r, g, b;
	
	if (s == 0)
	{
		r = g = b = Math.floor((l * 255));
	}
	else
	{
		if (l <= 0.5)
		{
			m2 = l * (s + 1);
		}
		else
		{
			m2 = l + s - l * s;
		}
		
		m1 = l * 2 - m2;
		
		r = Math.floor(hueToRgb(m1, m2, h + 1 / 3));
		g = Math.floor(hueToRgb(m1, m2, h));
		b = Math.floor(hueToRgb(m1, m2, h - 1/3));
	}
	
	return {r: r, g: g, b: b};
}

function hueToRgb(m1, m2, hue)
{
	var v;
	if (hue < 0)
		hue += 1;
	else if (hue > 1)
		hue -= 1;

	if (6 * hue < 1)
		v = m1 + (m2 - m1) * hue * 6;
	else if (2 * hue < 1)
		v = m2;
	else if (3 * hue < 2)
		v = m1 + (m2 - m1) * (2/3 - hue) * 6;
	else
		v = m1;

	return 255 * v;
}

function interpolateHue(hueStart, hueEnd, valueStart, valueEnd)
{
	// since the gradient will be RGB based, we need to add stops to hit all the
	// colors in the hue spectrum
	
	hueStopPositions = new Array();
	hueStopHsl = new Array();
	hueStopText = new Array();
	
	hueStopPositions.push(0);
	hueStopHsl.push(hslText(hueStart));
	hueStopText.push(round(valueStart));
	
	for
	(
		var i = (hueStart > hueEnd ? 5 / 6 : 1 / 6);
		(hueStart > hueEnd ? i > 0 : i < 1);
		i += (hueStart > hueEnd ? -1 : 1) / 6
	)
	{
		if
		(
			hueStart > hueEnd ?
				i > hueEnd && i < hueStart :
				i > hueStart && i < hueEnd
		)
		{
			hueStopPositions.push(lerp(i, hueStart, hueEnd, 0, 1));
			hueStopHsl.push(hslText(i));
			hueStopText.push(round(lerp
			(
				i,
				hueStart,
				hueEnd,
				valueStart,
				valueEnd
			)));
		}
	}
	
	hueStopPositions.push(1);
	hueStopHsl.push(hslText(hueEnd));
	hueStopText.push(round(valueEnd));
}

function keyLineAngle(angle, keyAngle, bendRadius, keyX, keyY, pointsX, pointsY)
{
	if ( angle < Math.PI / 2 && keyY < bendRadius * Math.sin(angle) 
	|| angle > Math.PI / 2 && keyY < bendRadius)
	{
		return Math.asin(keyY / bendRadius);
	}
	else
	{
		// find the angle of the normal to a tangent line that goes to
		// the label
		
		var textDist = Math.sqrt
		(
			Math.pow(keyX, 2) +
			Math.pow(keyY, 2)
		);
		
		var tanAngle = Math.acos(bendRadius / textDist) + keyAngle;
		
		if ( angle < tanAngle || angle < Math.PI / 2 )//|| labelLeft < centerX )
		{
			// angle doesn't reach far enough for tangent; collapse and
			// connect directly to label
			
			if ( keyY / Math.tan(angle) > 0 )
			{
				pointsX.push(keyY / Math.tan(angle));
				pointsY.push(keyY);
			}
			else
			{
				pointsX.push(bendRadius * Math.cos(angle));
				pointsY.push(bendRadius * Math.sin(angle));
			}
			
			return angle;
		}
		else
		{
			return tanAngle;
		}
	}
}

function keyOffset()
{
	return imageHeight - (keys - currentKey + 1) * (keySize + keyBuffer) + keyBuffer - margin;
}

function lerp(value, fromStart, fromEnd, toStart, toEnd)
{
	return (value - fromStart) *
		(toEnd - toStart) /
		(fromEnd - fromStart) +
		toStart;
}

function load()
{
	resize();
	
	var xmlElements = document.getElementsByTagName('data');
	var magnitudeName;
	
	var hueName;
	var hueDefault;
	var hueStart;
	var hueEnd;
	var valueStart;
	var valueEnd;
	
	for ( var element = xmlElements[0].firstChild; element; element = element.nextSibling )
	{
		if ( element.nodeType != 1 )
		{
			continue;
		}
		
		switch ( element.tagName.toLowerCase() )
		{
			case 'magnitude':
				magnitudeName = element.getAttribute('attribute');
				break;
			
			case 'attributes':
				for ( var i = 0; i < element.attributes.length; i++ )
				{
					attributeNames.push(element.attributes[i].nodeName);
					attributeDisplayNames.push(element.attributes[i].nodeValue);
				}
				break;
			
			case 'color':
				hueName = element.getAttribute('attribute');
				hueStart = Number(element.getAttribute('hueStart')) / 360;
				hueEnd = Number(element.getAttribute('hueEnd')) / 360;
				valueStart = Number(element.getAttribute('valueStart'));
				valueEnd = Number(element.getAttribute('valueEnd'));
				//
				interpolateHue(hueStart, hueEnd, valueStart, valueEnd);
				//
				if ( element.getAttribute('default') == 'true' )
				{
					hueDefault = true;
				}
				break;
			
			case 'node':
				head = loadTreeDOM
				(
					element,
					magnitudeName,
					hueName,
					hueStart,
					hueEnd,
					valueStart,
					valueEnd
				);
				break;
		}
	}
	
	if ( hueName )
	{
		hueDisplayName = attributeDisplayNames[attributeIndex(hueName)];
		
		//useHue.checked = true;
		useHueDiv.innerHTML =
			'<br/><div style="float:left">&nbsp;</div>' +
			'<input type="checkbox" id="useHue" style="float:left" ' +
			(hueDefault ? 'checked' : '') +
			'/><div style="float:left">Color by<br/>' + hueDisplayName +
			'</div><br/><br/>';
		useHueCheckBox = document.getElementById('useHue');
		useHueCheckBox.onclick = draw;
	}
	
	//head = head.collapse();
	head.sort();
	head.setDepth(1, 1);
	head.setBaseMagnitude(0);
	
	maxAbsoluteDepth = head.maxDepth();
	selectNode(head);
	
	setInterval(update, 20);
	window.onresize = handleResize;
	updateMaxAbsoluteDepth();
	updateViewNeeded = true;
}

function loadTreeDOM
(
	domNode,
	magnitudeName,
	hueName,
	hueStart,
	hueEnd,
	valueStart,
	valueEnd
)
{
	var newNode = new Node();
	
	for ( var i = 0; i < domNode.attributes.length; i++ )
	{
		var attributeCurrent = domNode.attributes[i];
		
		if ( attributeCurrent.nodeName == 'name' )
		{
			newNode.name = attributeCurrent.nodeValue;
		}
		else
		{
			newNode.attributes[attributeIndex(attributeCurrent.nodeName)] =
				attributeCurrent.nodeValue;
			
			if ( attributeCurrent.nodeName == magnitudeName )
			{
				newNode.magnitude = Number(attributeCurrent.nodeValue);
			}
			
			if ( attributeCurrent.nodeName == hueName && newNode.hue == null )
			{
				newNode.hue = lerp
				(
					Number(attributeCurrent.nodeValue),
					valueStart,
					valueEnd,
					hueStart,
					hueEnd
				);
			}
		}
	}
	
	for ( var child = domNode.firstChild; child; child = child.nextSibling )
	{
		if ( child.nodeType == 1 )
		{
			var newChild = loadTreeDOM
			(
				child,
				magnitudeName,
				hueName,
				hueStart,
				hueEnd,
				valueStart,
				valueEnd
			);
			newChild.parent = newNode;
			newNode.children.push(newChild);
		}
	}
	
	return newNode;
}

function maxAbsoluteDepthDecrease()
{
	if ( maxAbsoluteDepth > 2 )
	{
		maxAbsoluteDepth--;
		handleResize();
	}
}

function maxAbsoluteDepthIncrease()
{
	if ( maxAbsoluteDepth < head.maxDepth() )
	{
		maxAbsoluteDepth++;
		handleResize();
	}
}

function min(a, b)
{
	return a < b ? a : b;
}

function minWidth()
{
	// Min wedge width (at center) for displaying a node (or for displaying a
	// label if it's at the highest level being viewed, multiplied by 2 to make
	// further calculations simpler
	
	return (fontSize * 2.5);
}

function mouseMove(e)
{
	mouseX = e.pageX;
	mouseY = e.pageY - headerHeight;
	
	if ( head && ! quickLook )
	{
		checkHighlight();
	}
}

function mouseClick(e)
{
	if ( highlightedNode == focusNode && focusNode != selectedNode || selectedNode.hasParent(highlightedNode) )
	{
		if ( highlightedNode.hasChildren() )
		{
			expand(highlightedNode);
		}
	}
	else if ( progress == 1 )//( highlightedNode != selectedNode )
	{
		setFocus(highlightedNode);
//		document.body.style.cursor='ew-resize';
		draw();
		checkHighlight();
		var date = new Date();
		mouseDownTime = date.getTime();
		mouseDown = true;
	}
}

function mouseUp(e)
{
	if ( quickLook )
	{
		navigateBack();
		quickLook = false;
	}
	
	mouseDown = false;
}

function navigateBack()
{
	if ( nodeHistoryPosition > 0 )
	{
		nodeHistory[nodeHistoryPosition] = selectedNode;
		nodeHistoryPosition--;
		
		if ( nodeHistory[nodeHistoryPosition].collapse )
		{
			collapseCheckBox.checked = collapse = false;
		}
		
		setSelectedNode(nodeHistory[nodeHistoryPosition]);
		updateView();
	}
}

function navigateUp()
{
	if ( selectedNode.getParent() )
	{
		selectNode(selectedNode.getParent());
		updateView();
	}
}

function navigateForward()
{
	if ( nodeHistoryPosition < nodeHistory.length - 1 )
	{
		nodeHistoryPosition++;
		var newNode = nodeHistory[nodeHistoryPosition];
		
		if ( newNode.collapse )
		{
			collapseCheckBox.checked = collapse = false;
		}
		
		if ( nodeHistoryPosition == nodeHistory.length - 1 )
		{
			// this will ensure the forward button is disabled
			
			nodeHistory.length = nodeHistoryPosition;
		}
		
		setSelectedNode(newNode);
		updateView();
	}
}

function onKeyDown(event)
{
	if ( event.keyCode == 8 && document.activeElement.id != 'search' )
	{
		event.preventDefault();
	}
	else if ( event.keyCode == 83 )
	{
		progress += .01;
	}
	else if ( event.keyCode == 66 )
	{
		progress -= .01;
	}
	else if ( event.keyCode == 70 )
	{
		progress = 1;
	}
}

function onKeyUp(event)
{
	if ( event.keyCode == 8 && document.activeElement.id != 'search' )
	{
		navigateBack();
	}
	else if ( event.keyCode == 27 && document.activeElement.id == 'search' )
	{
		search.value = '';
		onSearchChange();
	}
}

function onSearchChange()
{
	nSearchResults = 0;
	head.search();
	
	if ( search.value == '' )
	{
		searchResults.innerHTML = '';
	}
	else
	{
		searchResults.innerHTML = nSearchResults + ' results';
	}
	
	setFocus(selectedNode);
	draw();
}

function resetKeyOffset()
{
	currentKey = 1;
	keyMinTextLeft = centerX + gRadius + buffer - buffer / (keys + 1) / 2 + fontSize / 2;
	keyMinAngle = 0;
}

function rgbText(r, g, b)
{
	var rgbArray =
	[
		"rgb(",
		Math.floor(r),
		",",
		Math.floor(g),
		",",
		Math.floor(b),
		")"
	];
	
	return rgbArray.join('');
}

function round(number)
{
	if ( number >= 1 )
	{
		return number.toFixed(0);
	}
	else
	{
		return number.toPrecision(1);
	}
}

function roundedRectangle(x, y, width, height, radius)
{
	if ( radius * 2 > width )
	{
		radius = width / 2;
	}
	
	if ( radius * 2 > height )
	{
		radius = height / 2;
	}
	
	context.beginPath();
	context.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2, false);
	context.lineTo(x + width - radius, y);
	context.arc(x + width - radius, y + radius, radius, Math.PI * 3 / 2, Math.PI * 2, false);
	context.lineTo(x + width, y + height - radius);
	context.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
	context.lineTo(x + radius, y + height);
	context.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);
	context.lineTo(x, y + radius);
}

function setCallBacks()
{
	canvas = document.getElementById('canvas');
	canvas.onselectstart = function(){return false;} // prevent unwanted highlighting
	context = canvas.getContext('2d');
	document.onmousemove = mouseMove;
	window.onblur = focusLost;
	window.onmouseout = focusLost;
	document.onkeyup = onKeyUp;
	document.onkeydown = onKeyDown;
	canvas.onmousedown = mouseClick;
	document.onmouseup = mouseUp;
	collapseCheckBox = document.getElementById('collapse');
	collapse = collapseCheckBox.checked;
	collapseCheckBox.onclick = handleResize;
	relativeColorCheckBox = document.getElementById('relativeColor');
	//relativeColorCheckBox.onchange = handleResize;
	maxAbsoluteDepthText = document.getElementById('maxAbsoluteDepth');
	maxAbsoluteDepthButtonDecrease = document.getElementById('maxAbsoluteDepthDecrease');
	maxAbsoluteDepthButtonIncrease = document.getElementById('maxAbsoluteDepthIncrease');
	maxAbsoluteDepthButtonDecrease.onclick = maxAbsoluteDepthDecrease;
	maxAbsoluteDepthButtonIncrease.onclick = maxAbsoluteDepthIncrease;
	fontSize = 12;
	fontSizeText = document.getElementById('fontSize');
	fontSizeButtonDecrease = document.getElementById('fontSizeDecrease');
	fontSizeButtonIncrease = document.getElementById('fontSizeIncrease');
	fontSizeButtonDecrease.onclick = fontSizeDecrease;
	fontSizeButtonIncrease.onclick = fontSizeIncrease;
	shortenCheckBox = document.getElementById('shorten');
	shortenCheckBox.onclick = handleResize;
	maxAbsoluteDepth = 0;
	backButton = document.getElementById('back');
	upButton = document.getElementById('up');
	forwardButton = document.getElementById('forward');
	backButton.onclick = navigateBack;
	upButton.onclick = navigateUp;
	forwardButton.onclick = navigateForward;
	snapshotButton = document.getElementById('snapshot');
	snapshotButton.onclick = snapshot;
	details = document.getElementById('details');
	detailsName = document.getElementById('detailsName');
	detailsExpand = document.getElementById('detailsExpand');
	detailsInfo = document.getElementById('detailsInfo');
	search = document.getElementById('search');
	search.onkeyup = onSearchChange;
	searchResults = document.getElementById('searchResults');
	useHueDiv = document.getElementById('useHueDiv');
}

function selectNode(newNode)
{
	if ( selectedNode != newNode )
	{
		// truncate history at current location to create a new branch
		//
		nodeHistory.length = nodeHistoryPosition;
		
		if ( selectedNode != 0 )
		{
			nodeHistory.push(selectedNode);
			nodeHistoryPosition++;
		}
		
		setSelectedNode(newNode);
		//updateView();
	}
}

function setFocus(node)
{
	focusNode = node;
	
	detailsName.innerHTML = node.name;
	
	var table = '<table>';
	
	for ( var i = 0; i < node.attributes.length; i++ )
	{
		if ( node.attributes[i] != undefined )
		{
			table +=
				'<tr><td><strong>' + attributeDisplayNames[i] + ':</strong></td><td>' +
				node.attributes[i] + '</td></tr>';
		}
	}
	
	table += '</table>';
	detailsInfo.innerHTML = table;
	
	detailsExpand.disabled = !focusNode.hasChildren() || focusNode == selectedNode;
//	document.body.style.cursor='ew-resize';
}

function setSelectedNode(newNode)
{
	if ( selectedNode && selectedNode.hasParent(newNode) )
	{
		zoomOut = true;
	}
	else
	{
		zoomOut = false;
	}
	
	selectedNodeLast = selectedNode;
	selectedNode = newNode;
	setFocus(selectedNode);
}

function snapshot()
{
	svg = svgHeader();
	
	resetKeyOffset();
	
	snapshotMode = true;
	
	selectedNode.draw(false, true);
	selectedNode.draw(true, true);
	
	if ( focusNode != 0 && focusNode != selectedNode )
	{
		focusNode.drawHighlightSVG();
	}
	
	if ( hueDisplayName && useHue() )
	{
		drawLegendSVG();
	}
	
	snapshotMode = false;
	
	svg += svgFooter();
	
	snapshotWindow = window.open
	(
		'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
		'snapshot'
	);
}

function svgFooter()
{
	return '</svg>';
}

function svgHeader()
{
	var patternWidth = fontSize * .6;//radius / 50;
	
	return '\
<?xml version="1.0" standalone="no"?>\
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" \
	"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\
<svg width="' + imageWidth + '" height="' + imageHeight + '" version="1.1"\
	xmlns="http://www.w3.org/2000/svg">\
<title>Krona - ' + selectedNode.name + '</title>\
<defs>\
	<style type="text/css">\
	text {font: ' + fontSize + 'px Times new roman; dominant-baseline:middle;baseline-shift:-10%}\
	text.left {text-align:left}\
	text.center {text-align:center}\
	text.right {text-align:right}\
	path.wedge {stroke:none}\
	path.line {fill:none;stroke:black;stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	line {stroke:black;stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	line.tick {stroke-width:' + thinLineWidth * fontSize / 6 + ';}\
	circle {fill:none;stroke:black;stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	rect {stroke:black;stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	.highlight {stroke:black;stroke-width:'+ highlightLineWidth + ';}\
	</style>\
<pattern id="hiddenPattern" patternUnits="userSpaceOnUse" \
x="0" y="0" width="' + patternWidth + '" height="' + patternWidth + '">\
<line x1="0" y1="0" x2="' + patternWidth / 2 + '" y2="' + patternWidth / 2 + '"/>\
<line x1="' + patternWidth / 2 + '" y1="' + patternWidth +
'" x2="' + patternWidth + '" y2="' + patternWidth / 2 + '"/>\
</pattern>\
</defs>\
';
}

function svgText(text, x, y)
{
	return '<text x="' + x + '" y="' + y +
		'" style="text-anchor:start;font:' + fontNormal +
		'">' + text + '</text>';
}

function update()
{
	if ( ! head )
	{
		return;
	}
	
	if ( mouseDown && focusNode != selectedNode )
	{
		var date = new Date();
		
		if ( date.getTime() - mouseDownTime > quickLookHoldLength )
		{
			if ( focusNode.hasChildren() )
			{
				expand(focusNode);
				quickLook = true;
			}
		}
	}
	
	if ( updateViewNeeded )
	{
		resize();
		mouseX = -1;
		mouseY = -1;
		
		collapse = collapseCheckBox.checked;
		shorten = shortenCheckBox.checked;
		checkSelectedCollapse();
		updateMaxAbsoluteDepth();
		
		if ( focusNode.getCollapse() || focusNode.depth > maxAbsoluteDepth )
		{
			setFocus(selectedNode);
		}
		
		updateView();
		
		updateViewNeeded = false;
	}
	
	var date = new Date();
	progress = (date.getTime() - tweenStartTime) / tweenLength;
//	progress += .01;
	
	if ( progress >= 1 )
	{
		progress = 1;
	}
	
	if ( progress != progressLast )
	{
		tweenFactor =
			(1 / (1 + Math.exp(-tweenCurvature * (progress - .5))) - .5) /
			(tweenMax - .5) / 2 + .5;
		
		if ( progress == 1 )
		{
			snapshotButton.disabled = false;
			zoomOut = false;
			
			if ( ! quickLook )
			{
				checkHighlight();
			}
			
			
			if ( fpsDisplay )
			{
				fpsDisplay.innerHTML = 'fps: ' + Math.round(tweenFrames * 1000 / tweenLength);
			}
		}
		
		draw();
	}
	
	progressLast = progress;
}

function updateView()
{
	if ( selectedNode.depth > maxAbsoluteDepth - 1 )
	{
		maxAbsoluteDepth = selectedNode.depth + 1;
	}
	
	highlightedNode = selectedNode;
	
	angleFactor = 2 * Math.PI / (selectedNode.magnitude);
	
	// visibility of nodes depends on the depth they are displayed at,
	// so we need to set the max depth assuming they can all be displayed
	// and iterate it down based on the deepest child node we can display
	//
	var maxDepth;
	var newMaxDepth = selectedNode.maxDepth();
	//
	do
	{
		maxDepth = newMaxDepth;
		
		if ( maxDepth > maxPossibleDepth )
		{
			maxDepth = maxPossibleDepth;
		}
		
		newMaxDepth = selectedNode.maxVisibleDepth(1, maxDepth);
		
		if ( newMaxDepth > maxPossibleDepth )
		{
			newMaxDepth = maxPossibleDepth;
		}
	}
	while ( newMaxDepth < maxDepth );
	
	if ( maxDepth < 2 )
	{
		maxDepth = 2;
	}
	
	maxDisplayDepth = maxDepth;
	nodeRadius = 1 / maxDepth;
	nLabelOffsets = Math.max(Math.floor(Math.sqrt((nodeRadius * gRadius / fontSize)) * 1.5), 3);
	lightnessFactor = (lightnessMax - lightnessBase) / maxDepth;
	keys = 0;
	
	labelOffsets = new Array(maxDepth + 1);
	labelLastNodes = new Array(maxDepth + 1);
	labelFirstNodes = new Array(maxDepth + 1);
	
	for ( var i = 0; i <= maxDepth; i++ )
	{
		labelOffsets[i] = 0;
		labelLastNodes[i] = new Array(nLabelOffsets + 1);
		labelFirstNodes[i] = new Array(nLabelOffsets + 1);
		
		for ( var j = 0; j <= nLabelOffsets; j++ )
		{
			// these arrays will allow nodes with neighboring labels to link to
			// each other to determine max label length
			
			labelLastNodes[i][j] = 0;
			labelFirstNodes[i][j] = 0;
		}
	}
	
	fontSizeText.innerHTML = fontSize;
	fontNormal = fontSize + 'px ' + fontFaceNormal;
	fontBold = 'bold ' + fontSize + 'px ' + fontFaceNormal;
	tickLength = fontSize * .7;
	
	head.setTargets(0, 1);
	
	keySize = ((imageHeight - margin * 2) * 1 / 2) / keys * 3 / 4;
	
	if ( keySize > fontSize * maxKeySizeFactor )
	{
		keySize = fontSize * maxKeySizeFactor;
	}
	
	keyBuffer = keySize / 3;
	
	fontSizeLast = fontSize;
	
	var date = new Date();
	tweenStartTime = date.getTime();
	progress = 0;
	tweenFrames = 0;
	
	document.title = 'Krona - ' + selectedNode.name;
	updateNavigationButtons();
	snapshotButton.disabled = true;
	
	maxAbsoluteDepthText.innerHTML = maxAbsoluteDepth - 1;
	
	maxAbsoluteDepthButtonDecrease.disabled = (maxAbsoluteDepth == 2);
	maxAbsoluteDepthButtonIncrease.disabled = (maxAbsoluteDepth == head.maxDepth());
	
	if ( collapse != collapseLast )
	{
		onSearchChange();
		collapseLast = collapse;
	}
}

function updateMaxAbsoluteDepth()
{
	while ( selectedNode.depth > maxAbsoluteDepth - 1 )
	{
		selectedNode = selectedNode.getParent();
	}
}

function updateNavigationButtons()
{
	backButton.disabled = (nodeHistoryPosition == 0);
	upButton.disabled = (selectedNode.getParent() == 0);
	forwardButton.disabled = (nodeHistoryPosition == nodeHistory.length);
}

function useHue()
{
	return useHueCheckBox && useHueCheckBox.checked;
}
/*
function zoomOut()
{
	return (
		selectedNodeLast != 0 &&
		selectedNodeLast.getDepth() < selectedNode.getDepth());
}
*/