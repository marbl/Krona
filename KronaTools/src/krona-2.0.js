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
var collapse = true;
var collapseCheckBox;
var collapseLast;
var compress;
var compressCheckBox;
var maxAbsoluteDepthText;
var maxAbsoluteDepthButtonDecrease;
var maxAbsoluteDepthButtonIncrease;
var fontSize = 11;
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
var panel;
var details;
var detailsName;
var search;
var searchResults;
var nSearchResults;
var searchActive;
var useHueCheckBox;
var useHueDiv;
var datasetDropDown;
var datasetButtonLast;
var datasetButtonPrev;
var datasetButtonNext;
var keyControl;
var showKeys = true;
var linkButton;
var linkText;
var frame;

// Node references. Note that the meanings of 'selected' and 'focused' are
// swapped in the docs.
//
var head; // the root of the entire tree
var nodes = new Array(); // tree nodes by id
var selectedNode = 0; // the root of the current view
var focusNode = 0; // a node chosen for more info (single-click)
var focusTreeView;
var highlightedNode = 0; // mouse hover node
var highlightedTreeView;
var highlightingHidden = false;
var treeViews = new Array();
var currentNodeID = 0; // to iterate while loading

var nodeHistory = new Array();
var nodeHistoryPosition = 0;

var dataEnabled = false; // true when supplemental files are present

// store non-Krona GET variables so they can be passed on to links
//
var getVariables = new Array();

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
var mapPositionX;
var mapPositionY;
var mapWidth = 150;
var maxLabelOverhang = Math.PI * 4.18;
var mapAngleStart = new Tween(0, 0);
var mapAngleEnd = new Tween(0, 0);
var mapRadiusInner = new Tween(0, 0);
var mapRadii;

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
var saturation = 0.5;
var lightnessBase = 0.6;
var lightnessMax = .8;
var thinLineWidth = .3;
var highlightLineWidth = 1.5;
var labelBoxBuffer = 6;
var labelBoxRounding = 15;
var labelWidthFudge = 1.05; // The width of unshortened labels are set slightly
							// longer than the name width so the animation
							// finishes faster.
var fontNormal;
var fontBold;
var fontFamily = 'sans-serif';
//var fontFaceBold = 'bold Arial';
var nodeRadius;
var tickLength;
var compressedRadii;

// colors
//
var highlightFill = 'rgba(255, 255, 255, .3)';
var colorUnclassified = 'rgb(220,220,220)';

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
var attributes = new Array();
//
var magnitudeIndex; // the index of attribute arrays used for magnitude
var membersAssignedIndex;
var membersSummaryIndex;

// For defining gradients
//
var hueDisplayName;
var hueStopPositions;
var hueStopHues;
var hueStopText;

// multiple datasets
//
var currentDataset = 0;
var lastDataset = 0;
var datasets = 1;
var datasetNames;
var datasetSelectSize = 40;
var datasetAlpha = new Tween(0, 0);
var datasetWidths = new Array();
var datasetChanged;
var datasetSelectWidth = 120;

window.onload = load;

var image;
var hiddenPattern;
var loadingImage;

function handleResize()
{
	updateViewNeeded = true;
}

function Attribute()
{
}

function Tween(start, end)
{
	this.start = start;
	this.end = end;
	
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
	this.id = currentNodeID;
	currentNodeID++;
	nodes[this.id] = this;
	
	this.children = Array();
	this.parent = 0;
	
	this.attributes = new Array(attributes.length);
	
	this.addChild = function(child)
	{
		this.children.push(child);
	};
	
	this.canDisplayDepth = function()
	{
		// whether this node is at a depth that can be displayed, according
		// to the max absolute depth
		
		return this.depth <= maxAbsoluteDepth;
	}
	
	this.getCollapse = function()
	{
		return (
			collapse &&
			this.collapse &&
			this.depth != maxAbsoluteDepth
			);
	}
	
	this.getData = function(dataset, index, summary)
	{
		var files = new Array();
		
		if
		(
			this.attributes[index] != null &&
			this.attributes[index][dataset] != null &&
			this.attributes[index][dataset] != ''
		)
		{
			files.push
			(
				document.location +
				'.files/' +
				this.attributes[index][dataset]
			);
		}
		
		if ( summary )
		{
			for ( var i = 0; i < this.children.length; i++ )
			{
				files = files.concat(this.children[i].getData(dataset, index, true));
			}
		}
		
		return files;
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
	
	this.getList = function(dataset, index, summary)
	{
		var list;
		
		if
		(
			this.attributes[index] != null &&
			this.attributes[index][dataset] != null
		)
		{
			list = this.attributes[index][dataset];
		}
		else
		{
			list = new Array();
		}
		
		if ( summary )
		{
			for ( var i = 0; i < this.children.length; i++ )
			{
				list = list.concat(this.children[i].getList(dataset, index, true));
			}
		}
		
		return list;
	}
	
	this.getMagnitude = function(dataset)
	{
		return this.attributes[magnitudeIndex][dataset];
	}
	
	this.getMaxDepth = function(limit)
	{
		var max;
		
		if ( collapse )
		{
			return this.maxDepthCollapsed;
		}
		else
		{
			if ( this.maxDepth > maxAbsoluteDepth )
			{
				return maxAbsoluteDepth;
			}
			else
			{
				return this.maxDepth;
			}
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
	
	this.search = function()
	{
		this.isSearchResult = false;
		this.searchResults = 0;
		
		if
		(
			! this.getCollapse() &&
			search.value != '' &&
			this.name.toLowerCase().indexOf(search.value.toLowerCase()) != -1
		)
		{
			this.isSearchResult = true;
			this.searchResults = 1;
			nSearchResults++;
		}
		
		for ( var i = 0; i < this.children.length; i++ )
		{
			this.searchResults += this.children[i].search();
		}
		
		return this.searchResults;
	}
	
	this.searchResultChildren = function()
	{
		if ( this.isSearchResult )
		{
			return this.searchResults - 1;
		}
		else
		{
			return this.searchResults;
		}
	}
	
	this.setDepth = function(depth, depthCollapsed)
	{
		this.depth = depth;
		this.depthCollapsed = depthCollapsed;
		
		if
		(
			this.children.length == 1 &&
//			this.magnitude > 0 &&
			this.children[0].magnitude == this.magnitude &&
			( head.children.length > 1 || this.children[0].children.length )
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
	
	this.setMaxDepths = function()
	{
		this.maxDepth = this.depth;
		this.maxDepthCollapsed = this.depthCollapsed;
		
		for ( i in this.children )
		{
			var child = this.children[i];
			
			child.setMaxDepths();
			
			if ( child.maxDepth > this.maxDepth )
			{
				this.maxDepth = child.maxDepth;
			}
			
			if
			(
				child.maxDepthCollapsed > this.maxDepthCollapsed &&
				(child.depth <= maxAbsoluteDepth || maxAbsoluteDepth == 0)
			)
			{
				this.maxDepthCollapsed = child.maxDepthCollapsed;
			}
		}
	}
	
	this.sort = function(dataset)
	{
		this.children.sort(function(a, b){return b.getMagnitude(dataset) - a.getMagnitude(dataset)});
		
		for (var i = 0; i < this.children.length; i++)
		{
			this.children[i].sort(dataset);
		}
	}
}

function TreeView(dataset, treeView)
{
	this.dataset = dataset;
	
	this.centerX = new Tween(0, 0);
	this.centerY = new Tween(0, 0);
	this.radius = new Tween(0, 0);
	
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
	
	if ( treeView != undefined )
	{
		this.centerX.end = treeView.centerX.current();
		this.centerY.end = treeView.centerY.current();
		this.radius.end = treeView.radius.current();
	}
	
	this.nodeViews = new Array();
	
	this.createNodeViews = function(node, treeView)
	{
		this.nodeViews[node.id] = new NodeView(this, node);
		
		if ( treeView != undefined )
		{
			this.nodeViews[node.id].initialize(treeView.nodeViews[node.id]);
		}
		
		for ( var i = 0; i < node.children.length; i++ )
		{
			this.createNodeViews(node.children[i], treeView);
		}
	}
	
	this.createNodeViews(head, treeView);
	
	this.draw = function()
	{
		var selectedNodeView = this.nodeViews[selectedNode.id];
		var highlightedNodeView = this.nodeViews[highlightedNode.id];
		
		this.centerXCurrent = this.centerX.current();
		this.centerYCurrent = this.centerY.current();
		this.radiusCurrent = this.radius.current();
		
		pushTranslation(this.centerXCurrent, this.centerYCurrent);
		
		resetKeyOffset();
		
		this.nodeViews[head.id].draw(false, false); // draw pie slices
		this.nodeViews[head.id].draw(true, false); // draw labels
		
		var pathRoot = selectedNode;
		
		if ( focusNode != 0 && focusNode != selectedNode )
		{
			context.globalAlpha = 1;
			this.nodeViews[focusNode.id].drawHighlight(true);
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
				highlightedNodeView.drawHighlight(true);
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
			highlightedNodeView.drawHighlightCenter();
		}
		
		if ( quickLook && false) // TEMP
		{
			context.globalAlpha = 1 - progress / 2;
			selectedNodeView.drawHighlight(true);
		}
		else if ( progress < 1 )//&& zoomOut() )
		{
			if ( !zoomOut)//() )
			{
				context.globalAlpha = selectedNodeView.alphaLine.current();
				selectedNodeView.drawHighlight(true);
			}
			else if ( selectedNodeLast && selectedNodeLast != focusNode )
			{
				context.globalAlpha = 1 - 4 * Math.pow(progress - .5, 2);
				this.nodeViews[selectedNodeLast.id].drawHighlight(false);
			}
		}
		
		drawDatasetName();
		
		//drawHistory();
		
		popTranslation();
	}
	
	this.resetLabelArrays = function()
	{
		this.labelOffsets = new Array(maxDisplayDepth - 1);
		this.labelLastNodes = new Array(maxDisplayDepth - 1);
		this.labelFirstNodes = new Array(maxDisplayDepth - 1);
		
		for ( var i = 0; i < maxDisplayDepth - 1; i++ )
		{
			this.labelOffsets[i] = Math.floor((nLabelOffsets[i] - 1) / 2);
			this.labelLastNodes[i] = new Array(nLabelOffsets[i] + 1);
			this.labelFirstNodes[i] = new Array(nLabelOffsets[i] + 1);
			
			for ( var j = 0; j <= nLabelOffsets[i]; j++ )
			{
				// these arrays will allow nodes with neighboring labels to link to
				// each other to determine max label length
				
				this.labelLastNodes[i][j] = 0;
				this.labelFirstNodes[i][j] = 0;
			}
		}
	}
}

function NodeView(treeView, node)
{
	this.treeView = treeView;
	this.node = node;
	
	this.angleStart = new Tween(Math.PI, 0);
	this.angleEnd = new Tween(Math.PI, 0);
	this.radiusInner = new Tween(1, 1);
	this.labelRadius = new Tween(1, 1);
	this.labelWidth = new Tween(0, 0);
	
	this.r = new Tween(255, 255);
	this.g = new Tween(255, 255);
	this.b = new Tween(255, 255);
	
	this.alphaLabel = new Tween(0, 1);
	this.alphaLine = new Tween(0, 1);
	this.alphaArc = new Tween(0, 0);
	this.alphaWedge = new Tween(0, 1);
	this.alphaOther = new Tween(0, 0);
	this.alphaPattern = new Tween(0, 0);
	
	if ( node.hues != undefined )
	{
		this.hue = new Tween(node.hues[treeView.dataset], node.hues[treeView.dataset]);
	}
	
	this.initialize = function(nodeView)
	{
		this.angleStart.end = nodeView.angleStart.current();
		this.angleEnd.end = nodeView.angleEnd.current();
		this.radiusInner.end = nodeView.radiusInner.current();
		this.labelRadius.end = nodeView.labelRadius.current();
		this.labelWidth.end = nodeView.labelWidth.current();
		
		this.r.end = nodeView.r.current();
		this.g.end = nodeView.g.current();
		this.b.end = nodeView.b.current();
		
		this.alphaLabel.end = nodeView.alphaLabel.current();
		this.alphaLine.end = nodeView.alphaLine.current();
		this.alphaArc.end = nodeView.alphaArc.current();
		this.alphaWedge.end = nodeView.alphaWedge.current();
		this.alphaOther.end = nodeView.alphaOther.current();
		this.alphaPattern.end = nodeView.alphaPattern.current();
	}
	
	this.addLabelNode = function(depth, labelOffset)
	{
		if ( this.treeView.labelHeadNodes[depth][labelOffset] == 0 )
		{
			// this will become the head node for this list
			
			this.treeView.labelHeadNodes[depth][labelOffset] = this;
			this.labelPrev = this;
		}
		
		var head = this.treeView.labelHeadNodes[depth][labelOffset];
		
		this.labelNext = head;
		this.labelPrev = head.labelPrev;
		head.labelPrev.labelNext = this;
		head.labelPrev = this;
	}
	
	this.canDisplayHistory = function()
	{
		return (
			-this.labelRadius.end * this.getTreeRadiusTarget() +
			historySpacingFactor * fontSize / 2 <
			compressedRadii[0] * this.getTreeRadiusTarget()
			);
	}
	
	this.canDisplayLabelCurrent = function()
	{
		return (
			(this.angleEnd.current() - this.angleStart.current()) *
			(this.radiusInner.current() + 1) * this.getTreeRadius() >=
			minWidth());
	}
	
	this.checkHighlight = function()
	{
		if ( this.node.children.length == 0 && this.node == focusNode )
		{
			//return false;
		}
		
		if ( this.hide )
		{
			return false;
		}
		
		if ( this.radiusInner.end == 1 )
		{
			// compressed to the outside; don't check
			
			return false;
		}
		
		for ( var i = 0; i < this.node.children.length; i++ )
		{
			if ( this.getChild(i).checkHighlight() )
			{
				return true;
			}
		}
		
		var highlighted = false;
		
		var angleStartCurrent = this.angleStart.current() + rotationOffset;
		var angleEndCurrent = this.angleEnd.current() + rotationOffset;
		var radiusInner = this.radiusInner.current() * this.getTreeRadius();
		
		if ( this != selectedNode && ! this.node.getCollapse() )
		{
			context.beginPath();
			context.arc(0, 0, radiusInner, angleStartCurrent, angleEndCurrent, false);
			context.arc(0, 0, this.getTreeRadius(), angleEndCurrent, angleStartCurrent, true);
			context.closePath();
			
			if ( context.isPointInPath(mouseX - this.getTreeCenterX(), mouseY - this.getTreeCenterY()) )
			{
				highlighted = true;
			}
			
			if
			(
				! highlighted &&
				(angleEndCurrent - angleStartCurrent) *
				(radiusInner + this.getTreeRadius()) <
				minWidth() &&
				this.node.getDepth() == selectedNode.getDepth() + 1
			)
			{
				if ( showKeys && this.checkHighlightKey() )
				{
					highlighted = true;
				}
			}
		}
		
		if ( highlighted )
		{
			if ( this.node != highlightedNode )
			{
			//	document.body.style.cursor='pointer';
			}
			
			setHighlightedNode(this.node);
			highlightedTreeView = this.treeView;
		}
		
		return highlighted;
	}
	
	this.checkHighlightCenter = function()
	{
		if ( ! this.canDisplayHistory() )
		{
			return;
		}
		
		var cx = this.getTreeCenterX();
		var cy = this.getTreeCenterY() - this.labelRadius.end * this.getTreeRadius();
		//var dim = context.measureText(this.name);
		
		var width = this.nameWidth;
		
		if ( this.node.searchResultChildren() )
		{
			var results = searchResultString(this.node.searchResultChildren());
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
			highlightedNode = this.node;
			return;
		}
		
		if ( this.node.getParent() )
		{
			this.treeView.nodeViews[this.node.getParent().id].checkHighlightCenter();
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
		if ( this.node.parent )
		{
			this.getParent().checkHighlightMap();
		}
		
		if ( this.node.getCollapse() || this.node == focusNode )
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
			highlightedNode = this.node;
		}
	}
	
	this.draw = function(labelMode, selected, searchHighlighted)
	{
		var depth = this.node.getDepth() - selectedNode.getDepth() + 1;
//		var hidden = false;
		
		if ( selectedNode == this.node )
		{
			selected = true;
		}
		
		var angleStartCurrent = this.angleStart.current() + rotationOffset;
		var angleEndCurrent = this.angleEnd.current() + rotationOffset;
		var radiusInner = this.radiusInner.current() * this.getTreeRadius();
		var canDisplayLabelCurrent = this.canDisplayLabelCurrent();
		var hiddenSearchResults = false;
		
/*		if ( ! this.hide )
		{
			for ( var i = 0; i < this.children.length; i++ )
			{
				if ( this.children[i].hide && this.children[i].searchResults )
				{
					hiddenSearchResults = true;
				}
			}
		}
*/		
		var drawChildren =
			( ! this.hide || ! this.hidePrev && progress < 1 ) &&
			( ! this.hideAlone || ! this.hideAlonePrev && progress < 1 );
		
//		if ( this.alphaWedge.current() > 0 || this.alphaLabel.current() > 0 )
		{
			var lastChildAngleEnd;
			
			if ( this.hasChildren() )//canDisplayChildren )
			{
				lastChildAngleEnd =
					this.getLastChild().angleEnd.current()
					+ rotationOffset;
			}
			
			if ( labelMode )
			{
				var drawRadial =
				!(
					this.node.parent &&
					this.node.parent != selectedNode &&
					angleEndCurrent == this.getParent().angleEnd.current() + rotationOffset
				);
				
				if ( angleStartCurrent != angleEndCurrent )
				{
					this.drawLines(angleStartCurrent, angleEndCurrent, radiusInner, drawRadial, selected);
				}
				
				var alphaOtherCurrent = this.alphaOther.current();
				var childRadiusInner;
				
				if ( this == selectedNode || alphaOtherCurrent )
				{
					childRadiusInner =
						this.getLastChild().radiusInner.current() * this.getTreeRadius();
				}
				
				if ( this == selectedNode )
				{
					this.drawReferenceRings(childRadiusInner);
				}
				
				if
				(
					selected &&
					! searchHighlighted &&
					this != selectedNode &&
					(
						this.node.isSearchResult ||
						this.hideAlone && this.node.searchResultChildren() ||
						false
//						this.hide &&
//						this.containsSearchResult
					)
				)
				{
					context.globalAlpha = this.alphaWedge.current();
					
					drawWedge
					(
						angleStartCurrent,
						angleEndCurrent,
						radiusInner,
						this.getTreeRadius(),
						highlightFill,
						0,
						true
					);
					
					if
					(
						this.keyed &&
						! showKeys &&
						this.node.searchResults &&
						! searchHighlighted &&
						this != highlightedNode &&
						this != focusNode
					)
					{
						var angle = (angleEndCurrent + angleStartCurrent) / 2;
						this.drawLabel(angle, true, false, true, true);
					}
					
					//this.drawHighlight(false);
					searchHighlighted = true;
				}
				
				if
				(
					this == selectedNode ||
//					true
					//(canDisplayLabelCurrent) &&
					this != highlightedNode &&
					this != focusNode
				)
				{
					if ( this.radial != this.radialPrev && this.alphaLabel.end == 1 )
					{
						context.globalAlpha = tweenFactor;
					}
					else
					{
						context.globalAlpha = this.alphaLabel.current();
					}
					
					this.drawLabel
					(
						(angleStartCurrent + angleEndCurrent) / 2,
						this.hideAlone && this.node.searchResultChildren() ||
						(this.node.isSearchResult || hiddenSearchResults) && selected,
						this == selectedNode && ! this.radial,
						selected,
						this.radial
					);
					
					if ( this.radial != this.radialPrev && this.alphaLabel.start == 1 && progress < 1 )
					{
						context.globalAlpha = 1 - tweenFactor;
						
						this.drawLabel
						(
							(angleStartCurrent + angleEndCurrent) / 2,
							(this.node.isSearchResult || hiddenSearchResults) && selected,
							this == selectedNodeLast && ! this.radialPrev,
							selected,
							this.radialPrev
						);
					}
				}
				
				if
				(
					alphaOtherCurrent &&
					lastChildAngleEnd != null
				)
				{
					if
					(
						(angleEndCurrent - lastChildAngleEnd) *
						(childRadiusInner + this.getTreeRadius()) >=
						minWidth()
					)
					{
						//context.font = fontNormal;
						context.globalAlpha = this.alphaOther.current();
						
						drawTextPolar
						(
							this.getUnclassifiedText(),
							this.getUnclassifiedPercentage(),
							(lastChildAngleEnd + angleEndCurrent) / 2,
							(childRadiusInner + this.getTreeRadius()) / 2,
							true,
							false,
							false,
							0,
							0
						);
					}
				}
				
				if ( this == selectedNode && this.keyUnclassified && showKeys )
				{
					this.drawKey
					(
						(lastChildAngleEnd + angleEndCurrent) / 2,
						false,
						false
					);
				}
			}
			else
			{
				var alphaWedgeCurrent = this.alphaWedge.current();
				
				if ( alphaWedgeCurrent || this.alphaOther.current() )
				{
					var currentR = this.r.current();
					var currentG = this.g.current();
					var currentB = this.b.current();
						
					var fill = rgbText(currentR, currentG, currentB);
					
					var radiusOuter;
					var lastChildAngle;
					var truncateWedge =
					(
						this.hasChildren() &&
						! this.keyed &&
						(compress || depth < maxDisplayDepth) &&
						drawChildren &&
						! snapshotMode
					);
					
					if ( truncateWedge )
					{
						radiusOuter = this.getChild(0).radiusInner.current() * this.getTreeRadius();
					}
					else
					{
						radiusOuter = this.getTreeRadius();
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
					context.globalAlpha = alphaWedgeCurrent;
					
					if ( radiusInner != radiusOuter )
					{
						drawWedge
						(
							angleStartCurrent,
							angleEndCurrent,
							radiusInner,
							radiusOuter,//this.radiusOuter.current() * gRadius,
							//'rgba(0, 200, 0, .1)',
							fill,
							this.alphaPattern.current()
						);
						
						if ( truncateWedge )
						{
							// fill in the extra space if the sum of our childrens'
							// magnitudes is less than ours
							
							if ( lastChildAngleEnd < angleEndCurrent )//&& false) // TEMP
							{
								if ( radiusOuter > 1 )
								{
									// overlap slightly to hide the seam
									
	//								radiusOuter -= 1;
								}
								
								if ( alphaWedgeCurrent < 1 )
								{
									context.globalAlpha = this.alphaOther.current();
									drawWedge
									(
										lastChildAngleEnd,
										angleEndCurrent,
										radiusOuter,
										this.getTreeRadius(),
										colorUnclassified,
										0
									);
									context.globalAlpha = alphaWedgeCurrent;
								}
								
								drawWedge
								(
									lastChildAngleEnd,
									angleEndCurrent,
									radiusOuter,
									this.getTreeRadius(),//this.radiusOuter.current() * gRadius,
									//'rgba(200, 0, 0, .1)',
									fill,
									this.alphaPattern.current()
								);
							}
						}
						
						if ( radiusOuter < this.getTreeRadius() )
						{
							// patch up the seam
							//
							context.beginPath();
							context.arc(0, 0, radiusOuter, angleStartCurrent/*lastChildAngleEnd*/, angleEndCurrent, false);
							context.strokeStyle = fill;
							context.lineWidth = 1;
							context.stroke();
						}
					}
					
					if ( this.keyed && selected && showKeys )//&& progress == 1 )
					{
						this.drawKey
						(
							(angleStartCurrent + angleEndCurrent) / 2,
							(
								this == highlightedNode ||
								this == focusNode ||
								this.node.searchResults
							),
							this.node == highlightedNode || this.node == focusNode
						);
					}
				}
			}
		}
		
		if ( drawChildren )
		{
			// draw children
			//
			for ( var i = 0; i < this.node.children.length; i++ )
			{
				if ( this.drawHiddenChildren(i, selected, labelMode, searchHighlighted) )
				{
					i = this.getChild(i).hiddenEnd;
				}
				else
				{
					this.getChild(i).draw(labelMode, selected, searchHighlighted);
				}
			}
		}
	};
	
	this.drawHiddenChildren = function
	(
		firstHiddenChild,
		selected,
		labelMode,
		searchHighlighted
	)
	{
		var firstChild = this.getChild(firstHiddenChild);
		
		if ( firstChild.hiddenEnd == null || firstChild.radiusInner.current() == 1 )
		{
			return false;
		}
		
		for ( var i = firstHiddenChild; i < firstChild.hiddenEnd; i++ )
		{
			if ( ! this.getChild(i).hide || ! this.getChild(i).hidePrev && progress < 1 )
			{
				return false;
			}
		}
		
		var angleStart = firstChild.angleStart.current() + rotationOffset;
		var lastChild = this.getChild(firstChild.hiddenEnd);
		var angleEnd = lastChild.angleEnd.current() + rotationOffset;
		var radiusInner = this.getTreeRadius() * firstChild.radiusInner.current();
		var hiddenChildren = firstChild.hiddenEnd - firstHiddenChild + 1;
		
		if ( labelMode )
		{
			var hiddenSearchResults = 0;
			
			for ( var i = firstHiddenChild; i <= firstChild.hiddenEnd; i++ )
			{
				hiddenSearchResults += this.node.children[i].searchResults;
			}
			
			if
			(
				selected &&
				(angleEnd - angleStart) * 
				(this.getTreeRadius() * 2) >=
				minWidth() ||
				hiddenSearchResults
			)
			{
				context.globalAlpha = this.alphaWedge.current();
				
				this.drawHiddenLabel
				(
					angleStart,
					angleEnd,
					hiddenChildren,
					hiddenSearchResults
				);
			}
		}
		
		var drawWedges = true;
		
		for ( var i = firstHiddenChild; i <= firstChild.hiddenEnd; i++ )
		{
			// all hidden children must be completely hidden to draw together
			
			if ( this.getChild(i).alphaPattern.current() != this.getChild(i).alphaWedge.current() )
			{
				drawWedges = false;
				break;
			}
		}
		
		if ( labelMode )
		{
			if ( drawWedges )
			{
				var drawRadial = (angleEnd < this.angleEnd.current() + rotationOffset);
				this.drawLines(angleStart, angleEnd, radiusInner, drawRadial);
			}
			
			if ( hiddenSearchResults && ! searchHighlighted )
			{
				drawWedge
				(
					angleStart,
					angleEnd,
					radiusInner,
					this.getTreeRadius(),//this.radiusOuter.current() * gRadius,
					highlightFill,
					0,
					true
				);
			}
		}
		else if ( drawWedges )
		{
			context.globalAlpha = this.alphaWedge.current();
			
			var fill = rgbText
			(
				firstChild.r.current(),
				firstChild.g.current(),
				firstChild.b.current()
			);
			
			drawWedge
			(
				angleStart,
				angleEnd,
				radiusInner,
				this.getTreeRadius(),//this.radiusOuter.current() * gRadius,
				fill,
				context.globalAlpha,
				false
			);
		}
		
		return drawWedges;
	}
	
	this.drawHiddenLabel = function(angleStart, angleEnd, value, hiddenSearchResults)
	{
		var textAngle = (angleStart + angleEnd) / 2;
		var labelRadius = this.getTreeRadius() + fontSize;//(radiusInner + radius) / 2;
		
		drawTick(this.getTreeRadius() - fontSize * .75, fontSize * 1.5, textAngle);
		drawTextPolar
		(
			value.toString() + ' more',
			0, // inner text
			textAngle,
			labelRadius,
			true, // radial
			hiddenSearchResults, // bubble
			this.node == highlightedNode || this.node == focusNode, // bold
			false,
			hiddenSearchResults
		);
	}
	
	this.drawHighlight = function(bold)
	{
		var angleStartCurrent = this.angleStart.current() + rotationOffset;
		var angleEndCurrent = this.angleEnd.current() + rotationOffset;
		var radiusInner = this.radiusInner.current() * this.getTreeRadius();
		
		//this.setHighlightStyle();
		
		if ( this.node == focusNode && this.node == highlightedNode && this.hasChildren() )
		{
//			context.fillStyle = "rgba(255, 255, 255, .3)";
			arrow
			(
				angleStartCurrent,
				angleEndCurrent,
				radiusInner,
				this.getTreeRadius()
			);
		}
		else
		{
			drawWedge
			(
				angleStartCurrent,
				angleEndCurrent,
				radiusInner,
				this.getTreeRadius(),
				highlightFill,
				0,
				true
			);
		}
		
		// check if hidden children should be highlighted
		//
		for ( var i = 0; i < this.node.children.length; i++ )
		{
			if
			(
				this.node.children[i].getDepth() - selectedNode.getDepth() + 1 <=
				maxDisplayDepth &&
				this.getChild(i).hiddenEnd != null
			)
			{
				var firstChild = this.getChild(i);
				var lastChild = this.getChild(firstChild.hiddenEnd);
				var hiddenAngleStart = firstChild.angleStart.current() + rotationOffset;
				var hiddenAngleEnd = lastChild.angleEnd.current() + rotationOffset;
				var hiddenRadiusInner = this.getTreeRadius() * firstChild.radiusInner.current();
				
				drawWedge
				(
					hiddenAngleStart,
					hiddenAngleEnd,
					hiddenRadiusInner,
					this.getTreeRadius(),
					'rgba(255, 255, 255, .3)',
					0,
					true
				);
				
				if ( ! this.node.searchResults )
				{
					this.drawHiddenLabel
					(
						hiddenAngleStart,
						hiddenAngleEnd,
						firstChild.hiddenEnd - i + 1
					);
				}
				
				i = firstChild.hiddenEnd;
			}
		}
		
//			context.strokeStyle = 'black';
		context.fillStyle = 'black';
		
		var highlight = ! ( progress < 1 && zoomOut && this == selectedNodeLast );
		
		var angle = (angleEndCurrent + angleStartCurrent) / 2;
		
		if ( ! (this.keyed && showKeys) )
		{
			this.drawLabel(angle, true, bold, true, this.radial);
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
		this.drawLabel(3 * Math.PI / 2, true, true, false);
		context.font = fontNormal;
	}
	
	this.drawKey = function(angle, highlight, bold)
	{
		var offset = keyOffset();
		var color;
		var patternAlpha = this.alphaPattern.end;
		var boxLeft = imageWidth - keySize - margin;
		var textY = offset + keySize / 2;
		var centerX = this.getTreeCenterX();
		var centerY = this.getTreeCenterY();
		var radius = this.getTreeRadius();
		
		var label;
		var keyNameWidth;
		
		if ( this == selectedNode )
		{
			color = colorUnclassified;
			label =
				this.getUnclassifiedText() +
				'   ' +
				this.getUnclassifiedPercentage();
			keyNameWidth = measureText(label, false);
		}
		else
		{
			label = this.keyLabel;
			color = rgbText(this.r.end, this.g.end, this.b.end);
			
			if ( highlight )
			{
				if ( this.node.searchResultChildren() )
				{
					label = label + searchResultString(this.node.searchResultChildren());
				}
				
				keyNameWidth = measureText(label, bold);
			}
			else
			{
				keyNameWidth = this.keyNameWidth;
			}
		}
		
		var textLeft = boxLeft - keyBuffer - keyNameWidth - fontSize / 2;
		var labelLeft = textLeft;
		
		if ( labelLeft > keyMinTextLeft - fontSize / 2 )
		{
			keyMinTextLeft -= fontSize / 2;
			
			if ( keyMinTextLeft < centerX - radius + fontSize / 2 )
			{
				keyMinTextLeft = centerX - radius + fontSize / 2;
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
		
		lineX.push(Math.cos(angle) * radius);
		lineY.push(Math.sin(angle) * radius);
		
		if ( angle < keyAngle && textY > centerY + Math.sin(angle) * (radius + buffer * (currentKey - 1) / (keys + 1) / 2 + buffer / 2) )
		{
			bendRadius = radius + buffer - buffer * currentKey / (keys + 1) / 2;
		}
		else
		{
			bendRadius = radius + buffer * currentKey / (keys + 1) / 2 + buffer / 2;
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
		
		context.globalAlpha = this.alphaWedge.current();
		
		if ( snapshotMode )
		{
			var labelSVG;
			
			if ( this.node == selectedNode )
			{
				labelSVG =
					this.getUnclassifiedText() +
					spacer() +
					this.getUnclassifiedPercentage();
			}
			else
			{
				labelSVG = this.node.name + spacer() + this.getPercentage() + '%';
			}
			
			svg +=
				'<rect fill="' + color + '" ' +
				'x="' + boxLeft + '" y="' + offset +
				'" width="' + keySize + '" height="' + keySize + '"/>';
			
			if ( patternAlpha )
			{
				svg +=
					'<rect fill="url(#hiddenPattern)" style="stroke:none" ' +
					'x="' + boxLeft + '" y="' + offset +
					'" width="' + keySize + '" height="' + keySize + '"/>';
			}
			
			svg +=
				'<path class="line' +
				(highlight ? ' highlight' : '') +
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
				if ( this.node.searchResultChildren() )
				{
					labelSVG = labelSVG + searchResultString(this.node.searchResultChildren());
				}
				
				drawBubbleSVG
				(
					boxLeft - keyBuffer - keyNameWidth - fontSize / 2,
					textY - fontSize,
					keyNameWidth + fontSize,
					fontSize * 2,
					fontSize,
					0
				);
				
				if ( this.node.isSearchResult )
				{
					drawSearchHighlights
					(
						label,
						boxLeft - keyBuffer - keyNameWidth,
						textY,
						0
					)
				}
			}
			
			svg += svgText(labelSVG, boxLeft - keyBuffer, textY, 'end', bold);
		}
		else
		{
			context.fillStyle = color;
			context.translate(-centerX, -centerY);
			context.strokeStyle = 'black';
				context.globalAlpha = 1;//this.alphaWedge.current();
			
			context.fillRect(boxLeft, offset, keySize, keySize);
			
			if ( patternAlpha )
			{
				context.globalAlpha = patternAlpha;
				context.fillStyle = hiddenPattern;
				
				// make clipping box for Firefox performance
				context.beginPath();
				context.moveTo(boxLeft, offset);
				context.lineTo(boxLeft + keySize, offset);
				context.lineTo(boxLeft + keySize, offset + keySize);
				context.lineTo(boxLeft, offset + keySize);
				context.closePath();
				context.save();
				context.clip();
				
				context.fillRect(boxLeft, offset, keySize, keySize);
				context.fillRect(boxLeft, offset, keySize, keySize);
				
				context.restore(); // remove clipping region
			}
			
			if ( highlight )
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
				context.moveTo(lineX[0] + centerX, lineY[0] + centerY);
				
				context.arc(centerX, centerY, bendRadius, angle, arcAngle, angle > arcAngle);
				
				for ( var i = 1; i < lineX.length; i++ )
				{
					context.lineTo(lineX[i] + centerX, lineY[i] + centerY);
				}
				
				context.globalAlpha = this.node == selectedNode ?
					this.getChild(0).alphaWedge.current() :
					this.alphaWedge.current();
				context.lineWidth = highlight ? highlightLineWidth : thinLineWidth;
				context.stroke();
				context.globalAlpha = 1;
			}
			
			if ( highlight )
			{
				drawBubbleCanvas
				(
					boxLeft - keyBuffer - keyNameWidth - fontSize / 2,
					textY - fontSize,
					keyNameWidth + fontSize,
					fontSize * 2,
					fontSize,
					0
				);
				
				if ( this.isSearchResult )
				{
					drawSearchHighlights
					(
						label,
						boxLeft - keyBuffer - keyNameWidth,
						textY,
						0
					)
				}
			}
			
			//drawText(label, boxLeft - keyBuffer, offset + keySize / 2, 0, 'end', bold);
			
			context.translate(centerX, centerY);
		}
		
		currentKey++;
	}
	
	this.drawLabel = function(angle, bubble, bold, selected, radial)
	{
		if ( context.globalAlpha == 0 )
		{
			return;
		}
		
		var innerText;
		var label;
		var radius;
		
		if ( radial )
		{
			radius = (this.radiusInner.current() + 1) * this.getTreeRadius() / 2;
		}
		else
		{
			radius = this.labelRadius.current() * this.getTreeRadius();
		}
		
		if ( radial && (selected || bubble ) )
		{
			var percentage = this.getPercentage();
			innerText = percentage + '%';
		}
		
		if
		(
			! radial &&
			this.node != selectedNode &&
			! bubble &&
			( !zoomOut || this.node != selectedNodeLast)
		)
		{
			label = this.shortenLabel(this.labelWidth.current());
		}
		else
		{
			label = this.node.name;
		}
		
		var flipped = drawTextPolar
		(
			label,
			innerText,
			angle,
			radius,
			radial,
			bubble,
			bold,
//			this.isSearchResult && this.shouldAddSearchResultsString() && (!selected || this == selectedNode || highlight),
			this.node.isSearchResult && (!selected || this.node == selectedNode || bubble),
			(this.hideAlone || !selected || this.node == selectedNode ) ? this.node.searchResultChildren() : 0
		);
		
		var depth = this.node.getDepth() - selectedNode.getDepth() + 1;
		
		if
		(
			! radial &&
			! bubble &&
			this != selectedNode &&
			this.angleEnd.end != this.angleStart.end &&
			nLabelOffsets[depth - 2] > 2 &&
			this.labelWidth.current() > (this.angleEnd.end - this.angleStart.end) * Math.abs(radius) &&
			! ( zoomOut && this.node == selectedNodeLast ) &&
			this.labelRadius.end > 0
		)
		{
			// name extends beyond wedge; draw tick mark towards the central
			// radius for easier identification
			
			var radiusCenter = compress ?
				(compressedRadii[depth - 1] + compressedRadii[depth - 2]) / 2 :
				(depth - .5) * nodeRadius;
			
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
	
	this.drawLines = function(angleStart, angleEnd, radiusInner, drawRadial, selected)
	{
		var radius = this.getTreeRadius();
		
		if ( snapshotMode )
		{
			if ( this.node != selectedNode)
			{
				if ( angleEnd == angleStart + Math.PI * 2 )
				{
					// fudge to prevent overlap, which causes arc ambiguity
					//
					angleEnd -= .1 / radius;
				}
				
				var longArc = angleEnd - angleStart > Math.PI ? 1 : 0;
				
				var x1 = radiusInner * Math.cos(angleStart);
				var y1 = radiusInner * Math.sin(angleStart);
				
				var x2 = radius * Math.cos(angleStart);
				var y2 = radius * Math.sin(angleStart);
				
				var x3 = radius * Math.cos(angleEnd);
				var y3 = radius * Math.sin(angleEnd);
				
				var x4 = radiusInner * Math.cos(angleEnd);
				var y4 = radiusInner * Math.sin(angleEnd);
				
				if ( this.alphaArc.end )
				{
					var dArray =
					[
						" M ", x4, ",", y4,
						" A ", radiusInner, ",", radiusInner, " 0 ", longArc,
							" 0 ", x1, ",", y1
					];
					
					svg += '<path class="line" d="' + dArray.join('') + '"/>';
				}
				
				if ( drawRadial && this.alphaLine.end )
				{
					svg += '<line x1="' + x3 + '" y1="' + y3 + '" x2="' + x4 + '" y2="' + y4 + '"/>';
				}
			}
		}
		else
		{
			context.lineWidth = thinLineWidth;
			context.strokeStyle = 'black';
			context.beginPath();
			context.arc(0, 0, radiusInner, angleStart, angleEnd, false);
			context.globalAlpha = this.alphaArc.current();
			context.stroke();
			
			if ( drawRadial )
			{
				var x1 = radiusInner * Math.cos(angleEnd);
				var y1 = radiusInner * Math.sin(angleEnd);
				var x2 = radius * Math.cos(angleEnd);
				var y2 = radius * Math.sin(angleEnd);
				
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				
//				if ( this.getCollapse() )//( selected && this != selectedNode )
				{
					context.globalAlpha = this.alphaLine.current();
				}
				
				context.stroke();
			}
		}
	}
	
	this.drawMap = function(child)
	{
		if ( this.node.parent )
		{
			this.getParent().drawMap(child);
		}
		
		if ( this.node.getCollapse() && this != child || this.node == focusNode )
		{
			return;
		}
		
		var childView = this.treeView.nodeViews[child.id];
		var angleStart =
			(childView.baseMagnitude - this.baseMagnitude) / this.magnitude * Math.PI * 2 +
			rotationOffset;
		var angleEnd =
			(childView.baseMagnitude - this.baseMagnitude + childView.magnitude) /
			this.magnitude * Math.PI * 2 +
			rotationOffset;
		
		var box = this.getMapPosition();
		
		context.save();
		context.fillStyle = 'black';
		context.textAlign = 'end';
		context.textBaseline = 'middle';
		
		var textX = box.x - mapRadius - mapBuffer;
		var percentage = getPercentage(child.magnitude / this.magnitude);
		
		var highlight = this.node == selectedNode || this.node == highlightedNode;
		
		if ( highlight )
		{
			context.font = fontBold;
		}
		else
		{
			context.font = fontNormal;
		}
		
		context.fillText(percentage + '% of', textX, box.y - mapRadius / 3);
		context.fillText(this.node.name, textX, box.y + mapRadius / 3);
		
		if ( highlight )
		{
			context.font = fontNormal;
		}
		
		if ( this.node == highlightedNode && this.node != selectedNode )
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
		
		if ( this.node == selectedNode )
		{
			context.lineWidth = 1;
			context.fillStyle = 'rgb(100, 100, 100)';
		}
		else
		{
			if ( this.node == highlightedNode )
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
		
		var maxDepth = this.node.getMaxDepth();
		
		if ( ! compress && maxDepth > maxPossibleDepth + this.node.getDepth() - 1 )
		{
			maxDepth = maxPossibleDepth + this.node.getDepth() - 1;
		}
		
		if ( this.node.getDepth() < selectedNode.getDepth() )
		{
			if ( child.getDepth() - 1 >= maxDepth )
			{
				maxDepth = child.getDepth();
			}
		}
		
		var radiusInner;
		
		if ( compress )
		{
			radiusInner = 0;
//				Math.atan(child.getDepth() - this.getDepth()) /
//				Math.PI * 2 * .9;
		}
		else
		{
			radiusInner =
				(child.getDepth() - this.node.getDepth()) /
				(maxDepth - this.node.getDepth() + 1);
		}
		
		context.stroke();
		context.beginPath();
		
		if ( radiusInner == 0 )
		{
			context.moveTo(box.x, box.y);
		}
		else
		{
			context.arc(box.x, box.y, mapRadius * radiusInner, angleEnd, angleStart, true);
		}
		
		context.arc(box.x, box.y, mapRadius, angleStart, angleEnd, false);
		context.closePath();
		context.fill();
		
		if ( this.node == highlightedNode && this.node != selectedNode )
		{
			context.lineWidth = 1;
			context.stroke();
		}
		
		context.restore();
	}
	
	this.drawReferenceRings = function(childRadiusInner)
	{
		if ( snapshotMode )
		{
			svg +=
				'<circle cx="' + centerX + '" cy="' + centerY +
				'" r="' + childRadiusInner + '"/>';
			svg +=
				'<circle cx="' + centerX + '" cy="' + centerY +
				'" r="' + this.getTreeRadius() + '"/>';
		}
		else
		{
			context.globalAlpha = 1 - this.alphaLine.current();//this.getUncollapsed().alphaLine.current();
			context.beginPath();
			context.arc(0, 0, childRadiusInner, 0, Math.PI * 2, false);
			context.stroke();
			context.beginPath();
			context.arc(0, 0, this.getTreeRadius(), 0, Math.PI * 2, false);
			context.stroke();
		}
	}
	
	this.getChild = function(index)
	{
		return this.treeView.nodeViews[this.node.children[index].id];
	}
	
	this.getMagnitude = function()
	{
		return this.node.getMagnitude(this.treeView.dataset);
	}
	
	this.getMapPosition = function()
	{
		return {
			x : (details.offsetLeft + details.clientWidth - mapRadius),
			y : ((focusNode.getDepth() - this.node.getDepth()) *
				(mapBuffer + mapRadius * 2) - mapRadius) +
				details.clientHeight + details.offsetTop
		};
	}
	
	this.getLastChild = function()
	{
		return this.children[this.children.length - 1];
	}
	
	this.getLastChild = function()
	{
		return this.getChild(this.node.children.length - 1);
	}
	
	this.getParent = function()
	{
		return this.treeView.nodeViews[this.node.parent.id];
	}
	
	this.getPercentage = function()
	{
		return getPercentage(this.magnitude / this.treeView.nodeViews[selectedNode.id].magnitude);
	}
	
	this.getTreeCenterX = function()
	{
		return this.treeView.centerXCurrent;
	}
	
	this.getTreeCenterY = function()
	{
		return this.treeView.centerYCurrent;
	}
	
	this.getTreeRadius = function()
	{
		return this.treeView.radiusCurrent;
	}
	
	this.getTreeRadiusTarget = function()
	{
		return this.treeView.radius.end;
	}
	
	this.getUnclassifiedPercentage = function()
	{
		var lastChild = this.getLastChild();
		
		return getPercentage
		(
			(
				this.baseMagnitude +
				this.magnitude -
				lastChild.magnitude -
				lastChild.baseMagnitude
			) / this.magnitude
		) + '%';
	}
	
	this.getUnclassifiedText = function()
	{
		return '[unassigned '+ this.node.name + ']';
	}
	
	this.getUncollapsed = function()
	{
		// recurse through collapsed children until uncollapsed node is found
		
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
		return this.node.children.length && this.node.depth < maxAbsoluteDepth;// && this.magnitude;
	}
	
	this.maxVisibleDepth = function(maxDepth, node, radii)
	{
		var childInnerRadius;
		var depth = this.node.getDepth() - node.getDepth() + 1;
		var currentMaxDepth = depth;
		
		if ( this.hasChildren() && depth < maxDepth)
		{
			var lastChild = this.getLastChild();
			
			if
			(
				lastChild.baseMagnitude + lastChild.magnitude <
				this.baseMagnitude + this.magnitude
			)
			{
				currentMaxDepth++;
			}
			
			childInnerRadius = radii[depth - 1];
			
			for ( var i = 0; i < this.node.children.length; i++ )
			{
				if
				(//true ||
					this.getChild(i).magnitude *
					this.treeView.angleFactor *
					(childInnerRadius + 1) *
					this.getTreeRadiusTarget() >=
					minWidth()
				)
				{
					var childMaxDepth = this.getChild(i).maxVisibleDepth(maxDepth, node, radii);
					
					if ( childMaxDepth > currentMaxDepth )
					{
						currentMaxDepth = childMaxDepth;
					}
				}
			}
		}
		
		return currentMaxDepth;
	}
	
	this.resetLabelWidth = function()
	{
		var nameWidthOld = this.nameWidth;
		
		if ( ! this.radial || this.keyed )//&& fontSize != fontSizeLast )
		{
			var dim = context.measureText(this.node.name);
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
	
	this.setHighlightStyle = function()
	{
		context.lineWidth = highlightLineWidth;
		
		if ( this.hasChildren() || this.node != focusNode || this.node != highlightedNode )
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
		
		if ( node.hide )
		{
//			alert('wtf');
			return;
		}
		
		var radius = this.getTreeRadiusTarget();
		var angle = (this.angleStart.end + this.angleEnd.end) / 2;
		var a; // angle difference
		
		if ( node == selectedNode )
		{
			a = Math.abs(angle - node.angleOther);
		}
		else
		{
			a = Math.abs(angle - (node.angleStart.end + node.angleEnd.end) / 2);
		}
		
		if ( a == 0 )
		{
			return;
		}
		
		if ( a > Math.PI )
		{
			a = 2 * Math.PI - a;
		}
		
		if ( node.radial || node == selectedNode )
		{
			var nodeLabelRadius;
			
			if ( node == selectedNode )
			{
				// radial 'other' label
				
				nodeLabelRadius = (node.children[0].radiusInner.end + 1) / 2;
			}
			else
			{
				nodeLabelRadius = (node.radiusInner.end + 1) / 2;
			}
			
			if ( a < Math.PI / 2 )
			{
				var r = this.labelRadius.end * radius + .5 * fontSize
				var hypotenuse = r / Math.cos(a);
				var opposite = r * Math.tan(a);
				var fontRadius = .8 * fontSize;
				
				if
				(
					nodeLabelRadius * radius < hypotenuse &&
					this.labelWidth.end / 2 + fontRadius > opposite
				)
				{
					this.labelWidth.end = 2 * (opposite - fontRadius);
				}
			}
		}
		else if
		(
			this.labelRadius.end == node.labelRadius.end &&
			a < Math.PI / 4
		)
		{
			// same radius with small angle; use circumferential approximation
			
			var dist = a * this.labelRadius.end * radius - fontSize * (1 - a * 4 / Math.PI) * 1.0;
			
			if ( this.labelWidth.end < dist )
			{
				node.restrictLabelWidth((dist - this.labelWidth.end / 2) * 2);
			}
			else if ( node.labelWidth.end < dist )
			{
				this.restrictLabelWidth((dist - node.labelWidth.end / 2) * 2);
			}
			else
			{
				// both labels reach halfway point; restrict both
				
				this.labelWidth.end = dist;
				node.labelWidth.end = dist
			}
		}
		else
		{
			var r1 = this.labelRadius.end * radius;
			var r2 = node.labelRadius.end * radius;
			
			// first adjust the radii to account for the height of the font by shifting them
			// toward each other
			//
			var fontFudge = .35 * fontSize;
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
			var l1 = Math.sin(a + b - Math.PI / 2) * dist / Math.sin(Math.PI - a);
			
			// distance from other label center the the intersection of the two tangents
			//
			var l2 = Math.sin(Math.PI / 2 - b) * dist / Math.sin(Math.PI - a);
			
			l1 = Math.abs(l1) - .4 * fontSize;
			l2 = Math.abs(l2) - .4 * fontSize;
/*			
			// amount to shorten the distances because of the height of the font
			//
			var l3 = 0;
			var fontRadius = fontSize * .55;
			//
			if ( l1 < 0 || l2 < 0 )
			{
				var l4 = fontRadius / Math.tan(a);
			l1 = Math.abs(l1);
			l2 = Math.abs(l2);
			
				l1 -= l4;
				l2 -= l4;
			}
			else
			{
				var c = Math.PI - a;
				
				l3 = fontRadius * Math.tan(c / 2);
			}
*/			
			if ( this.labelWidth.end / 2 > l1 && node.labelWidth.end / 2 > l2 )
			{
				// shorten the farthest one from the intersection
				
				if ( l1 > l2 )
				{
					this.restrictLabelWidth(2 * (l1));// - l3 - fontRadius));
				}
				else
				{
					node.restrictLabelWidth(2 * (l2));// - l3 - fontRadius));
				}
			}/*
			else if ( this.labelWidth.end / 2 > l1 + l3 && node.labelWidth.end / 2 > l2 - l3 )
			{
				node.restrictLabelWidth(2 * (l2 - l3));
			}
			else if ( this.labelWidth.end / 2 > l1 - l3 && node.labelWidth.end / 2 > l2 + l3 )
			{
				this.restrictLabelWidth(2 * (l1 - l3));
			}*/
		}
	}
	
	this.setMagnitudes = function(baseMagnitude)
	{
		this.magnitude = this.node.getMagnitude(this.treeView.dataset);
		this.baseMagnitude = baseMagnitude;
		
		for ( var i = 0; i < this.node.children.length; i++ )
		{
			this.getChild(i).setMagnitudes(baseMagnitude);
			baseMagnitude += this.getChild(i).magnitude;
		}
		
		this.maxChildMagnitude = baseMagnitude;
	}
	
	this.setTargetLabelRadius = function()
	{
		var depth = this.node.getDepth() - selectedNode.getDepth() + 1;
		var index = depth - 2;
		var labelOffset = this.treeView.labelOffsets[index];
		
		if ( this.radial )
		{
			//this.labelRadius.setTarget((this.radiusInner.end + 1) / 2);
			var max =
				depth == maxDisplayDepth ?
				1 :
				compressedRadii[index + 1];
			
			this.labelRadius.setTarget((compressedRadii[index] + max) / 2);
		}
		else
		{
			var radiusCenter;
			var width;
			
			if ( nLabelOffsets[index] > 1 )
			{
				this.labelRadius.setTarget
				(
					lerp
					(
						labelOffset + .75,
						0,
						nLabelOffsets[index] + .5,
						compressedRadii[index],
						compressedRadii[index + 1]
					)
				);
			}
			else
			{
				this.labelRadius.setTarget((compressedRadii[index] + compressedRadii[index + 1]) / 2);
			}
		}
		
		if ( ! this.hide && ! this.keyed && nLabelOffsets[index] )
		{
			// check last and first labels in each track for overlap
			
			for ( var i = 0; i < maxDisplayDepth - 1; i++ )
			{
				for ( var j = 0; j <= nLabelOffsets[i]; j++ )
				{
					var last = this.treeView.labelLastNodes[i][j];
					var first = this.treeView.labelFirstNodes[i][j];
					
					if ( last )
					{
						if ( j == nLabelOffsets[i] )
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
						if ( j == nLabelOffsets[i] )
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
			
			if ( selectedNode.canDisplayLabelOther )
			{
				this.setLabelWidth(selectedNode); // in case there is an 'other' label
			}
			
			if ( this.radial )
			{
				// use the last 'track' of this depth for radial
				
				this.treeView.labelLastNodes[index][nLabelOffsets[index]] = this;
				
				if ( this.treeView.labelFirstNodes[index][nLabelOffsets[index]] == 0 )
				{
					this.treeView.labelFirstNodes[index][nLabelOffsets[index]] = this;
				}
			}
			else
			{
				this.treeView.labelLastNodes[index][labelOffset] = this;
				
				// update offset
				
				this.treeView.labelOffsets[index] += 1;
				
				if ( this.treeView.labelOffsets[index] > nLabelOffsets[index] )
				{
					this.treeView.labelOffsets[index] -= nLabelOffsets[index];
					
					if ( !(nLabelOffsets[index] & 1) )
					{
						this.treeView.labelOffsets[index]--;
					}
				}
				else if ( this.treeView.labelOffsets[index] == nLabelOffsets[index] )
				{
					this.treeView.labelOffsets[index] -= nLabelOffsets[index];
					
					if ( false && !(nLabelOffsets[index] & 1) )
					{
						this.treeView.labelOffsets[index]++;
					}
				}
				
				if ( this.treeView.labelFirstNodes[index][labelOffset] == 0 )
				{
					this.treeView.labelFirstNodes[index][labelOffset] = this;
				}
			}
		}
		else if ( this.hide )
		{
			this.labelWidth.end = 0;
		}
	}
	
	this.setTargets = function()
	{
		if ( this.node == selectedNode )
		{
			this.setTargetsSelected
			(
				0,
				1,
				lightnessBase,
				false,
				false
			);
			return;
		}
		
		var depthRelative = this.node.getDepth() - selectedNode.getDepth();
		var parentOfSelected = selectedNode.hasParent(this.node);
		var selectedNodeView = this.treeView.nodeViews[selectedNode.id];
		
		if ( parentOfSelected )
		{
			this.resetLabelWidth();
		}
		else
		{
			//context.font = fontNormal;
			var dim = context.measureText(this.node.name);
			this.nameWidth = dim.width;
			//this.labelWidth.setTarget(this.labelWidth.end);
			this.labelWidth.setTarget(0);
		}
		
		// set angles
		//
		if ( this.baseMagnitude <= selectedNodeView.baseMagnitude )
		{
			this.angleStart.setTarget(0);
		}
		else
		{
			this.angleStart.setTarget(Math.PI * 2);
		}
		//
		if
		(
			parentOfSelected ||
			this.baseMagnitude + this.magnitude >=
			selectedNodeView.baseMagnitude + selectedNodeView.magnitude
		)
		{
			this.angleEnd.setTarget(Math.PI * 2);
		}
		else
		{
			this.angleEnd.setTarget(0);
		}
		
		// children
		//
		for ( var i = 0; i < this.node.children.length; i++ )
		{
			this.getChild(i).setTargets();
		}
		
		if ( depthRelative < 1 )
		{
			// collapse in
			
			this.radiusInner.setTarget(0);
			
			if ( parentOfSelected )
			{
				this.labelRadius.setTarget
				(
					(depthRelative) *
					historySpacingFactor * fontSize / this.getTreeRadiusTarget()
				);
			}
			else
			{
				this.labelRadius.setTarget(0);
				//this.scale.setTarget(1); // TEMP
			}
		}
		else if ( depthRelative + 1 > maxDisplayDepth )
		{
			// collapse out
			
			this.radiusInner.setTarget(1);
			this.labelRadius.setTarget(1);
		}
		else
		{
			// don't collapse
			
			this.radiusInner.setTarget(compressedRadii[depthRelative - 1]);
			
			if ( this == selectedNode )
			{
				this.labelRadius.setTarget(0);
			}
			else
			{
				this.labelRadius.setTarget
				(
					(compressedRadii[depthRelative - 1] + compressedRadii[depthRelative]) / 2
				);
			}
		}
		
		this.r.setTarget(255);
		this.g.setTarget(255);
		this.b.setTarget(255);

		this.alphaLine.setTarget(0);
		this.alphaArc.setTarget(0);
		this.alphaWedge.setTarget(0);
		this.alphaPattern.setTarget(0);
		this.alphaOther.setTarget(0);
		
		if ( parentOfSelected && ! this.node.getCollapse() )
		{
			var alpha =
			(
				1 -
				(-depthRelative) /
				(
					Math.floor
					(
						(compress ? compressedRadii[0] : nodeRadius) *
						this.getTreeRadiusTarget() /
						(historySpacingFactor * fontSize) -
						.5
					) +
					1
				)
			);
			
			if ( alpha < 0 )
			{
				alpha = 0;
			}
			
			this.alphaLabel.setTarget(alpha);
			this.radial = false;
		}
		else
		{
			this.alphaLabel.setTarget(0);
		}
		
		this.hideAlonePrev = this.hideAlone;
		this.hidePrev = this.hide;
		
		if ( parentOfSelected )
		{
			this.hideAlone = false;
			this.hide = false;
		}
		
		if ( this.node.getParent() == selectedNode.getParent() )
		{
			this.hiddenEnd = null;
		}
		
		this.radialPrev = this.radial;
	}
	
	this.setTargetsSelected = function(hueMin, hueMax, lightness, hide, nextSiblingHidden)
	{
		var collapse = this.node.getCollapse();
		var depth = this.node.getDepth() - selectedNode.getDepth() + 1;
		var canDisplayChildLabels = false;
		var lastChild;
		
		if ( this.hasChildren() )//&& ! hide )
		{
			lastChild = this.getLastChild();
			this.hideAlone = true;
		}
		else
		{
			this.hideAlone = false;
		}
		
		if ( (this.keyed || treeViews.length > 1 && depth == 2 && ! collapse)  && ! keyedNodeIds[this.node.id] )
		{
			keyedNodeIds[this.node.id] = true;
			keys.push(this.node);
		}
		
		// set child wedges
		//
		for ( var i = 0; i < this.node.children.length; i++ )
		{
			this.getChild(i).setTargetWedge();
			
			if
			(
				! this.getChild(i).hide &&
				( collapse || depth < maxDisplayDepth ) &&
				this.node.depth < maxAbsoluteDepth
			)
			{
				canDisplayChildLabels = true;
				this.hideAlone = false;
			}
		}
		
		if ( this.node == selectedNode || lastChild && lastChild.angleEnd.end < this.angleEnd.end - .01)
		{
			this.hideAlone = false;
		}
		
		if ( this.hideAlonePrev == undefined )
		{
			this.hideAlonePrev = this.hideAlone;
		}
		
		if ( this.node == selectedNode )
		{
			var otherArc = 
				this.treeView.angleFactor *
				(
					this.baseMagnitude + this.magnitude -
					lastChild.baseMagnitude - lastChild.magnitude
				);
			this.canDisplayLabelOther =
				otherArc *
				(this.getChild(0).radiusInner.end + 1) * this.getTreeRadiusTarget() >=
				minWidth();
			
			this.keyUnclassified = false;
			
			if ( this.canDisplayLabelOther )
			{
				this.angleOther = Math.PI * 2 - otherArc / 2;
			}
			else if ( otherArc > 0.0000000001 )
			{
				this.keyUnclassified = true;
				//keys++;
			}
			
			this.angleStart.setTarget(0);
			this.angleEnd.setTarget(Math.PI * 2);
			this.radiusInner.setTarget(0);
			this.hidePrev = this.hide;
			this.hide = false;
			this.hideAlonePrev = this.hideAlone;
			this.hideAlone = false;
			this.keyed = false;
		}
		
		if ( hueMax - hueMin > 1 / 12 )
		{
			hueMax = hueMin + 1 / 12;
		}
		
		// set lightness
		//
		if ( ! ( hide || this.hideAlone ) )
		{
			if ( useHue() )
			{
				lightness = (lightnessBase + lightnessMax) / 2;
			}
			else
			{
				lightness = lightnessBase + (depth - 1) * lightnessFactor;
				
				if ( lightness > lightnessMax )
				{
					lightness = lightnessMax;
				}
			}
		}
		
		if ( hide )
		{
			this.hide = true;
		}
		
		if ( this.hidePrev == undefined )
		{
			this.hidePrev = this.hide;
		}
		
		var hiddenStart = -1;
		var hiddenHueNumer = 0;
		var hiddenHueDenom = 0;
		var i = 0;
		
		if ( ! this.hide )
		{
			this.hiddenEnd = null;
		}
		
		while ( true )
		{
			if ( ! this.hideAlone && ! hide && ( i == this.node.children.length || ! this.getChild(i).hide ) )
			{
				// reached a non-hidden child or the end; set targets for
				// previous group of hidden children (if any) using their
				// average hue
				
				if ( hiddenStart != -1 )
				{
					var hiddenHue = hiddenHueDenom ? hiddenHueNumer / hiddenHueDenom : hueMin;
					
					for ( var j = hiddenStart; j < i; j++ )
					{
						this.getChild(j).setTargetsSelected
						(
							hiddenHue,
							null,
							lightness,
							false,
							j < i - 1
						);
						
						this.getChild(j).hiddenEnd = null;
					}
					
					this.getChild(hiddenStart).hiddenEnd = i - 1;
				}
			}
			
			if ( i == this.node.children.length )
			{
				break;
			}
			
			var nChildren = this.node.children.length;
			var child = this.getChild(i);
			var childHueMin;
			var childHueMax;
			
			if ( this.magnitude > 0 && ! this.hide && ! this.hideAlone )
			{
				if ( useHue() )
				{
					childHueMin = this.node.children[i].hues[this.treeView.dataset];
				}
				else if ( this.node == selectedNode )
				{
					var min = 0.0;
					var max = 1.0;
					
					if ( nChildren > 6 )
					{
						childHueMin = lerp((1 - Math.pow(1 - i / nChildren, 1.4)) * .95, 0, 1, min, max);
						childHueMax = lerp((1 - Math.pow(1 - (i + .55) / nChildren, 1.4)) * .95, 0, 1, min, max);
					}
					else
					{
						childHueMin = lerp(i / nChildren, 0, 1, min, max);
						childHueMax = lerp((i + .55) / nChildren, 0, 1, min, max);
					}
				}
				else
				{
					childHueMin = lerp
					(
						child.baseMagnitude,
						this.baseMagnitude, 
						this.baseMagnitude + this.magnitude,
						hueMin,
						hueMax
					);
					childHueMax = lerp
					(
						child.baseMagnitude + child.magnitude * .99,
						this.baseMagnitude,
						this.baseMagnitude + this.magnitude,
						hueMin,
						hueMax
					);
				}
			}
			else
			{
				childHueMin = hueMin;
				childHueMax = hueMax;
			}
			
			if ( ! this.hideAlone && ! hide && ! this.hide && child.hide )
			{
				if ( hiddenStart == -1 )
				{
					hiddenStart = i;
				}
				
				if ( useHue() )
				{
					hiddenHueNumer += childHueMin * child.magnitude;
					hiddenHueDenom += child.magnitude;
				}
				else
				{
					hiddenHueNumer += childHueMin;
					hiddenHueDenom++;
				}
			}
			else
			{
				hiddenStart = -1;
				
				this.getChild(i).setTargetsSelected
				(
					childHueMin,
					childHueMax,
					lightness,
					hide || this.keyed || this.hideAlone || this.hide && ! collapse,
					false
				);
			}
			
			i++;
		}
		
	 	if ( this.hue && this.magnitude )
	 	{
		 	this.hue.setTarget(this.node.hues[this.treeView.dataset]);
			
			if ( this.node.attributes[magnitudeIndex][this.treeView.lastDataset] == 0 )
			{
				this.hue.start = this.hue.end;
			}
		}
	 	
		this.radialPrev = this.radial;
		
		if ( this.node == selectedNode )
		{
			this.resetLabelWidth();
			this.labelWidth.setTarget(this.nameWidth * labelWidthFudge);
			this.alphaWedge.setTarget(0);
			this.alphaLabel.setTarget(1);
			this.alphaOther.setTarget(1);
			this.alphaArc.setTarget(0);
			this.alphaLine.setTarget(0);
			this.alphaPattern.setTarget(0);
			this.r.setTarget(255);
			this.g.setTarget(255);
			this.b.setTarget(255);
			this.radial = false;
			this.labelRadius.setTarget(0);
		}
		else
		{
			var rgb = hslToRgb
			(
				hueMin,
				saturation,
				lightness
			);
			
			this.r.setTarget(rgb.r);
			this.g.setTarget(rgb.g);
			this.b.setTarget(rgb.b);
			this.alphaOther.setTarget(0);
			
			this.alphaWedge.setTarget(1);
			
			if ( this.hide || this.hideAlone )
			{
				this.alphaPattern.setTarget(1);
			}
			else
			{
				this.alphaPattern.setTarget(0);
			}
			
			// set radial
			//
			if ( ! ( hide || this.hide ) )//&& ! this.keyed )
			{
				if ( this.hideAlone )
				{
					this.radial = true;
				}
				else if ( false && canDisplayChildLabels )
				{
					this.radial = false;
				}
				else
				{
					this.radial = true;
					
					if ( this.hasChildren() && depth < maxDisplayDepth )
					{
						var lastChild = this.getLastChild();
						
						if
						(
							lastChild.angleEnd.end == this.angleEnd.end ||
							(
								(this.angleStart.end + this.angleEnd.end) / 2 -
								lastChild.angleEnd.end
							) * (this.radiusInner.end + 1) * this.getTreeRadiusTarget() * 2 <
							minWidth()
						)
						{
							this.radial = false;
						}
					}
				}
			}
			
			// set alphaLabel
			//
			if
			(
				collapse ||
				hide ||
				this.hide ||
				this.keyed ||
				depth > maxDisplayDepth ||
				! this.node.canDisplayDepth()
			)
			{
				this.alphaLabel.setTarget(0);
			}
			else
			{
				if
				(
					(this.radial || nLabelOffsets[depth - 2])
				)
				{
					this.alphaLabel.setTarget(1);
				}
				else
				{
					this.alphaLabel.setTarget(0);
					
					if ( this.radialPrev )
					{
						this.alphaLabel.start = 0;
					}
				}
			}
			
			// set alphaArc
			//
			if
			(
				collapse ||
				hide ||
				depth > maxDisplayDepth ||
				! this.node.canDisplayDepth()
			)
			{
				this.alphaArc.setTarget(0);
			}
			else
			{
				this.alphaArc.setTarget(1);
			}
			
			// set alphaLine
			//
			if
			(
				hide ||
				this.hide && nextSiblingHidden ||
				depth > maxDisplayDepth ||
				! this.node.canDisplayDepth()
			)
			{
				this.alphaLine.setTarget(0);
			}
			else
			{
				this.alphaLine.setTarget(1);
			}
			
			//if (  ! this.radial )
			{
				this.resetLabelWidth();
			}
			
			// set labelRadius target
			//
			if ( collapse )
			{
				this.labelRadius.setTarget(this.radiusInner.end);
			}
			else
			{
				if ( depth > maxDisplayDepth || ! this.node.canDisplayDepth() )
				{
					this.labelRadius.setTarget(1);
				}
				else
				{
					this.setTargetLabelRadius();
				}
			}
		}
	}
	
	this.setTargetWedge = function()
	{
		var depth = this.node.getDepth() - selectedNode.getDepth() + 1;
		
		// set angles
		//
		var baseMagnitudeRelative = this.baseMagnitude - this.treeView.nodeViews[selectedNode.id].baseMagnitude;
		//
		this.angleStart.setTarget(baseMagnitudeRelative * this.treeView.angleFactor);
		this.angleEnd.setTarget((baseMagnitudeRelative + this.magnitude) * this.treeView.angleFactor);
		
		// set radiusInner
		//
		if ( depth > maxDisplayDepth || ! this.node.canDisplayDepth() )
		{
			this.radiusInner.setTarget(1);
		}
		else
		{
			this.radiusInner.setTarget(compressedRadii[depth - 2]);
		}
		
		if ( this.hide != undefined )
		{
			this.hidePrev = this.hide;
		}
		
		if ( this.hideAlone != undefined )
		{
			this.hideAlonePrev = this.hideAlone;
		}
		
		// set hide
		//
		if
		(
			(this.angleEnd.end - this.angleStart.end) *
			(this.radiusInner.end + 1) * this.getTreeRadiusTarget() <
			minWidth()
		)
		{
			if ( depth == 2 && ! this.node.getCollapse() && this.node.depth <= maxAbsoluteDepth )
			{
				this.keyed = true;
				this.hide = false;
				
				var percentage = this.getPercentage();
				this.keyLabel = this.node.name + '   ' + percentage + '%';
				var dim = context.measureText(this.keyLabel);
				this.keyNameWidth = dim.width;
			}
			else
			{
				this.keyed = false;
				this.hide = depth > 2;
			}
		}
		else
		{
			this.keyed = false;
			this.hide = false;
		}
	}
	
	this.shortenLabel = function(maxWidth)
	{
		var label = this.node.name;
		
		var labelWidth = this.nameWidth;
		var minEndLength = 0;
		
		if ( labelWidth > maxWidth && label.length > minEndLength * 2 )
		{
			var endLength =
				Math.floor((label.length - 1) * maxWidth / (labelWidth + ellipsisWidth) / 2);
			
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
	
/*	this.shouldAddSearchResultsString = function()
	{
		if ( this.isSearchResult )
		{
			return this.searchResults > 1;
		}
		else
		{
			return this.searchResults > 0;
		}
	}
*/	
}

function addOptionElement(innerHTML, title, id)
{
	var div = document.createElement("div");
//	div.style.position = 'absolute';
//	div.style.top = position + 'px';
	div.innerHTML = innerHTML;
	div.width = '100%';
	
	if ( title )
	{
		div.title = title;
	}
	
	panel.appendChild(div);
	return div;
}

var uiDatasetCheckboxes;

function addOptionElements(hueName, hueDefault)
{
	document.body.style.font = '11px sans-serif';
	var position = 5;
	
	panel = document.createElement('div');
	panel.style.position = 'absolute';
	panel.style.maxWidth = '25%';
//	details.style.right = '100%';
	panel.style.left = '75%';
	panel.style.height = '100%';
	panel.style.borderLeft = '1px solid gray';
	panel.padding = '0';
//	details.style.textAlign = 'right';
	document.body.insertBefore(panel, canvas);
//		<div id="details" style="position:absolute;top:1%;right:2%;text-align:right;">

	position = addOptionElement
	(
'&nbsp;<input style="float:left" type="button" id="back" value="&larr;" title="Go back (Shortcut: &larr;)"/>\
<input style="float:left" type="button" id="forward" value="&rarr;" title="Go forward (Shortcut: &rarr;)"/> \
&nbsp;<input style="float:left;max-width:100%;" type="text" id="search"/>\
<input style="float:left" type="button" value="x" onclick="searchClear()"/> \
<span id="searchResults"></span>'
	);
	
	details = addOptionElement(
'<span id="detailsName" style="font-weight:bold"></span>&nbsp;\
<br/>\
<div id="detailsInfo"></div>');

	keyControl = document.createElement('input');
	keyControl.type = 'button';
	keyControl.value = showKeys ? 'x' : '…';
	keyControl.style.position = '';
	keyControl.style.position = 'fixed';
	keyControl.style.visibility = 'hidden';
	
	document.body.insertBefore(keyControl, canvas);
	
//	document.getElementById('options').style.fontSize = '9pt';
	
	if ( datasets > 1 )
	{
		var size = datasets < datasetSelectSize ? datasets : datasetSelectSize;
		uiDatasets = document.createElement('div');
		details.appendChild(uiDatasets);
		uiDatasets.style.overflowY = 'scroll';
		var table = document.createElement('table');
		uiDatasets.appendChild(table);
		table.width = '100%';
		table.padding = '0px';
		table.style.font = fontNormal;
		table.innerHTML = '';
		uiDatasetRowsById = new Array();
		uiDatasetCheckboxes = new Array();
		uiDatasetCharts = new Array();
		
		for ( var i = 0; i < datasetNames.length; i++ )
		{
			var row = document.createElement('tr');
			var tdName = document.createElement('td');
			var tdCheckbox = document.createElement('td');
			var tdChart = document.createElement('td');
			var checkbox = document.createElement('input');
			var chart = document.createElement('div');
			
			checkbox.type = 'checkbox';
			table.appendChild(row);
			row.appendChild(tdName);
			row.appendChild(tdCheckbox);
			row.appendChild(tdChart);
			tdCheckbox.appendChild(checkbox);
			tdName.kronaDataset = i;
			tdChart.appendChild(chart);
			checkbox.kronaDataset = i;
	//		row.onclick = mouseClick;
			tdName.onmouseover = function(){setHighlightedDataset(this.kronaDataset)};
			uiDatasetRowsById[i] = tdName;
			uiDatasetCheckboxes[i] = checkbox;
			uiDatasetCharts[i] = chart;
			tdName.onclick = function(){selectDataset(this.kronaDataset)};
			checkbox.onclick = function(){toggleDataset(this.kronaDataset)};
			tdName.innerHTML = datasetNames[i];//treeViews[0].nodeViews[keys[i].id].shortenLabel(uiKeys.clientWidth - 22);
//			row.kronaShortened = divName.innerHTML != keys[i].name;
			tdName.style.overflowX = 'hidden';
			tdName.style.maxWidth = (uiDatasets.clientWidth - 20) + 'px';
			chart.style.width = "25px";
			chart.style.height = "15px";
			chart.style.border = "1px solid gray";
			row.style.padding = '0px';
			tdName.style.padding = '0px';
			tdCheckbox.style.padding = '0px';
			chart.style.backgroundColor = '#DDDDDD';//rgbText(nodeView.r.end, nodeView.g.end, nodeView.b.end);
			//td2.style.backgroundImage = 'url("' + image.src + '")';
		}
		
		datasetButtonLast = document.getElementById('lastDataset');
		datasetButtonPrev = document.getElementById('prevDataset');
		datasetButtonNext = document.getElementById('nextDataset');
	}
	
	position = addOptionElement
	(
'&nbsp;<input type="button" id="maxAbsoluteDepthDecrease" value="-"/>\
<span id="maxAbsoluteDepth"></span>\
&nbsp;<input type="button" id="maxAbsoluteDepthIncrease" value="+"/> Max depth',
'Maximum depth to display, counted from the top level \
and including collapsed wedges.'
	);
	
	position = addOptionElement
	(
'&nbsp;<input type="button" id="fontSizeDecrease" value="-"/>\
<span id="fontSize"></span>\
&nbsp;<input type="button" id="fontSizeIncrease" value="+"/> Font size'
	);
	
	if ( hueName )
	{
		hueDisplayName = attributes[attributeIndex(hueName)].displayName;
		
		position = addOptionElement
		(
			'<div style="float:left">&nbsp;</div>' +
			'<input type="checkbox" id="useHue" style="float:left" ' +
			'/><div style="float:left">Color by<br/>' + hueDisplayName +
			'</div>'
		);
		
		useHueCheckBox = document.getElementById('useHue');
		useHueCheckBox.checked = hueDefault;
		useHueCheckBox.onclick = handleResize;
	}
	/*
	position = addOptionElement
	(
		position + 5,
		'&nbsp;<input type="checkbox" id="shorten" checked="checked" />Shorten labels</div>',
		'Prevent labels from overlapping by shortening them'
	);
	
	position = addOptionElement
	(
		position,
		'&nbsp;<input type="checkbox" id="compress" checked="checked" />Compress',
		'Compress wedges if needed to show the entire depth'
	);
	*/
	position = addOptionElement
	(
		'&nbsp;<input type="checkbox" id="collapse" checked="checked" />Collapse',
		'Collapse wedges that are redundant (entirely composed of another wedge)'
	);
	
	position = addOptionElement
	(
		'&nbsp;<input type="button" id="snapshot" value="Snapshot"/>',
'Render the current view as SVG (Scalable Vector Graphics), a publication-\
quality format that can be printed and saved (see Help for browser compatibility)'
	);
	
	position = addOptionElement
	(
'&nbsp;<input type="button" id="linkButton" value="Link"/>\
<input type="text" size="30" id="linkText"/>',
'Show a link to this view that can be copied for bookmarking or sharing'
	);
	
	position = addOptionElement
	(
'&nbsp;<input type="button" id="help" value="?"\
onclick="window.open(\'https://sourceforge.net/p/krona/wiki/Browsing%20Krona%20charts/\', \'help\')"/>',
'Help'
	);
	
	uiKeys = addOptionElement
	(
		'', 'Legend'
	);
	uiKeys.style.overflowX = 'hidden';
	uiKeys.style.position = 'absolute';
	uiKeys.style.overflowY = 'scroll';
	uiKeys.style.height = '25%';
	uiKeys.style.width = '100%';
	uiKeys.style.bottom = '0%';
	uiKeys.style.borderTop = '1px solid black';
	uiKeyTable = document.createElement('table');
	uiKeys.appendChild(uiKeyTable);
}

function arrow(angleStart, angleEnd, radiusInner, radiusOuter)
{
	if ( context.globalAlpha == 0 )
	{
		return;
	}
	
	var angleCenter = (angleStart + angleEnd) / 2;
	var radiusArrowInner = radiusInner - radiusOuter / 10;//nodeRadius * gRadius;
	var radiusArrowOuter = radiusOuter * 1.1;//(1 + nodeRadius);
	var radiusArrowCenter = (radiusArrowInner + radiusArrowOuter) / 2;
	var pointLength = (radiusArrowOuter - radiusArrowInner) / 5;
	
	context.fillStyle = highlightFill;
	context.lineWidth = highlightLineWidth;
	
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
	context.arc(0, 0, radiusOuter, angleEnd, angleCenter, true);
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
	context.arc(0, 0, radiusOuter, angleStart, angleCenter, false);
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
	context.arc(0, 0, radiusOuter, angleEnd, angleCenter - 2 / (2 * Math.PI * radiusOuter), true);
	context.fill();
	context.stroke();
}

function attributeIndex(aname)
{
	for ( var i = 0 ; i < attributes.length; i++ )
	{
		if ( aname == attributes[i].name )
		{
			return i;
		}
	}
	
	return null;
}

function bound(value, min, max)
{
	if ( min != undefined && value < min )
	{
		return min;
	}
	else if ( max != undefined && value > max )
	{
		return max;
	}
	else
	{
		return value;
	}
}

function checkHighlight()
{
	var lastHighlightedNode = highlightedNode;
	var lastHighlightingHidden = highlightingHidden;
	
	setHighlightedNode(selectedNode);
	resetKeyOffset();
	
	if ( progress == 1 )
	{
		for ( var i = 0; i < treeViews.length; i++ )
		{
			treeViews[i].nodeViews[selectedNode.id].checkHighlight();
			
			if ( selectedNode.getParent() )
			{
				treeViews[i].nodeViews[selectedNode.getParent().id].checkHighlightCenter();
			}
			
			//treeViews[i].nodeViews[focusNode.id].checkHighlightMap();
		}
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

function computeRadii(node)
{
	// visibility of nodes depends on the depth they are displayed at,
	// so we need to set the max depth assuming they can all be displayed
	// and iterate it down based on the deepest child node we can display
	
	var maxDepth;
	var newMaxDepth = node.getMaxDepth() - node.getDepth() + 1;
	
	var minRadiusInner = fontSize * 8 / treeViews[0].radius.end;
	var minRadiusFirst = fontSize * 6 / treeViews[0].radius.end;
	var minRadiusOuter = fontSize * 5 / treeViews[0].radius.end;
	
	if ( .25 < minRadiusInner )
	{
		minRadiusInner = .25;
	}
	
	if ( .15 < minRadiusFirst )
	{
		minRadiusFirst = .15;
	}
	
	if ( .15 < minRadiusOuter )
	{
		minRadiusOuter = .15;
	}
	
	do
	{
		maxDepth = newMaxDepth;
		
		if ( ! compress && maxDepth > maxPossibleDepth )
		{
			maxDepth = maxPossibleDepth;
		}
		
		radii = new Array(maxDepth);
		
		radii[0] = minRadiusInner;
		
		var offset = 0;
		
		while
		(
			lerp
			(
				Math.atan(offset + 2),
				Math.atan(offset + 1),
				Math.atan(maxDepth + offset - 1),
				minRadiusInner,
				1 - minRadiusOuter
			) - minRadiusInner > minRadiusFirst &&
			offset < 10
		)
		{
			offset++;
		}
		
		offset--;
		
		for ( var i = 1; i < maxDepth; i++ )
		{
			radii[i] = lerp
			(
				Math.atan(i + offset),
				Math.atan(offset),
				Math.atan(maxDepth + offset - 1),
				minRadiusInner,
				1 - minRadiusOuter
			)
		}
		
		newMaxDepth = treeViews[0].nodeViews[selectedNode.id].maxVisibleDepth(maxDepth, node, radii);
	}
	while ( newMaxDepth < maxDepth );
	
	return radii;
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
	
	drawMap();
	
	for ( var i = 0; i < treeViews.length; i++ )
	{
		treeViews[i].draw();
	}
	
	context.globalAlpha = 1;
	
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
		degrees(rotation) + ',' + 0 + ',' + 0 +
		')"/>';
}

function drawDatasetName()
{
	var alpha = datasetAlpha.current();
	
	if ( alpha > 0 )
	{
		var radius = treeViews[0].radiusCurrent * compressedRadii[0] / -2; // TODO; gRadius
		
		if ( alpha > 1 )
		{
			alpha = 1;
		}
		
		context.globalAlpha = alpha;
		
		drawBubble(0, -radius, datasetWidths[currentDataset], false, false);
		drawText(datasetNames[currentDataset], 0, radius, 0, 'center', true);
	}
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
	context.font = fontNormal;
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

function getMapArc(nodeView)
{
	var headView = treeViews[0].nodeViews[head.id];
	
	return {
		start: nodeView.baseMagnitude / headView.magnitude * Math.PI * 2,
		end: (nodeView.baseMagnitude + nodeView.magnitude) / headView.magnitude * Math.PI * 2
	};
}

function drawMap()
{
	mapRadius = (Math.sqrt(Math.pow(treeViews[0].centerX.end, 2) + Math.pow(treeViews[0].centerY.end, 2)) - treeViews[0].radius.end) * .25;
	mapPositionX = treeViews[0].centerX.end + treeViews[0].centerX.end * .8;
	mapPositionY = treeViews[0].centerY.end * .20
	
	if ( mapRadius > maxMapRadius )
	{
//		mapRadius = maxMapRadius;
	}
	
	var radiusInner = mapRadiusInner.current() * mapRadius;
	var angleStart = mapAngleStart.current() + rotationOffset;
	var angleEnd = mapAngleEnd.current() + rotationOffset;
	
	context.save();
	
	context.translate(mapPositionX, mapPositionY);
	context.fillStyle = '#DDDDDD';
	context.strokeStyle = '#DDDDDD';
	context.beginPath();
	context.arc(0, 0, mapRadius, 0, Math.PI * 2, false);
	context.stroke();
	context.beginPath();
	context.arc(0, 0, radiusInner, angleEnd, angleStart, true);
	context.arc(0, 0, mapRadius, angleStart, angleEnd, false);
	context.fill();
	
	if ( radiusInner )
	{
		context.strokeStyle = '#CCCCCC';
		context.stroke();
	}
	
	//if ( highlightedNode != selectedNode || focusNode != selectedNode )// || selectedNode != head )
	{
		var node;
		
		if ( highlightedNode != selectedNode )
		{
			node = highlightedNode;
		}
		else
		{
			node = focusNode;
		}
		
		var highlightArc = getMapArc(treeViews[0].nodeViews[node.id]);
		
		highlightArc.start += rotationOffset;
		highlightArc.end += rotationOffset;
		
		var highlightRadiusInner = node == head ? 0 :
			mapRadii[node.getDepth() - 2] * mapRadius;
		
		context.beginPath();
		
		if ( node == head )
		{
			context.arc(0, 0, mapRadius, 0, Math.PI * 2, false);
		}
		else
		{
			context.arc(0, 0, highlightRadiusInner, highlightArc.end, highlightArc.start, true);
			context.arc(0, 0, mapRadius, highlightArc.start, highlightArc.end, false);
			context.closePath();
		}
		
		context.lineWidth = 2;
		context.strokeStyle = '#CCCCCC';
		context.stroke();
	}
	
	context.restore();
}

function drawSearchHighlights(label, bubbleX, bubbleY, rotation, center)
{
	var index = -1;
	var labelLength = label.length;
	
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
					'" class="searchHighlight' +
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

function drawText(text, x, y, angle, anchor, bold)
{
	if ( snapshotMode )
	{
		svg +=
			'<text x="' + x + '" y="' + y +
			'" text-anchor="' + anchor + '" style="font-weight:' + (bold ? 'bold' : 'normal') +
			'" transform="rotate(' + degrees(angle) + ',' + 0 + ',' + 0 + ')">' +
			text + '</text>';
	}
	else
	{
		context.fillStyle = 'black';
		context.textAlign = anchor;
		context.font = bold ? fontBold : fontNormal;
		context.rotate(angle);
		context.fillText(text, x, y);
		context.rotate(-angle);
	}
}

function drawTextPolar
(
	text,
	innerText,
	angle,
	radius,
	radial,
	bubble,
	bold, 
	searchResult,
	searchResults
)
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
	
	if ( bubble )
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
		
		if ( searchResults )
		{
			textActual = textActual + searchResultString(searchResults);
		}
		
		var textWidth = measureText(textActual, bold);
		
		var x = textX;
		
		if ( anchor == 'end' )
		{
			x -= textWidth;
		}
		else if ( anchor != 'start' )
		{
			// centered
			x -= textWidth / 2;
		}
		
		drawBubble(angle, radius, textWidth, radial, flip);
		
		if ( searchResult )
		{
			drawSearchHighlights
			(
				textActual,
				x,
				textY,
				angle,
				true
			)
		}
	}
	
	if ( searchResults )
	{
		totalText = totalText + searchResultString(searchResults);
	}
	
	drawText(totalText, textX, textY, angle, anchor, bold);
	
	return flip;
}

function drawTick(start, length, angle)
{
	if ( snapshotMode )
	{
		svg +=
			'<line x1="' + start +
			'" y1="' + 0 +
			'" x2="' + (start + length) +
			'" y2="' + 0 +
			'" class="tick" transform="rotate(' +
			degrees(angle) + ',' + 0 + ',' + 0 +
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
{ // TODO: radiusOuter for snapshot
	if ( context.globalAlpha == 0 )
	{
		return;
	}
	
	if ( snapshotMode )
	{
		if ( angleEnd == angleStart + Math.PI * 2 )
		{
			// fudge to prevent overlap, which causes arc ambiguity
			//
			angleEnd -= .1 / radiusOuter;
		}
		
		var longArc = angleEnd - angleStart > Math.PI ? 1 : 0;
		
		var x1 = radiusInner * Math.cos(angleStart);
		var y1 = radiusInner * Math.sin(angleStart);
		
		var x2 = radiusOuter * Math.cos(angleStart);
		var y2 = radiusOuter * Math.sin(angleStart);
		
		var x3 = radiusOuter * Math.cos(angleEnd);
		var y3 = radiusOuter * Math.sin(angleEnd);
		
		var x4 = radiusInner * Math.cos(angleEnd);
		var y4 = radiusInner * Math.sin(angleEnd);
		
		var dArray =
		[
			" M ", x1, ",", y1,
			" L ", x2, ",", y2,
			" A ", radiusOuter, ",", radiusOuter, " 0 ", longArc, ",1 ", x3, ",", y3,
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
		// fudge to prevent seams during animation
		//
		angleEnd += 1 / imageWidth; // TODO: gRadius?
		
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
		
		if ( highlight )
		{
			context.lineWidth = highlight ? highlightLineWidth : thinLineWidth;
			context.strokeStyle = 'black';
			context.stroke();
		}
	}
}

function expand(node)
{
	selectNode(node);
	handleResize();
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

function getGetString(name, value, bool)
{
	return name + '=' + (bool ? value ? 'true' : 'false' : value);
}

function hideLink()
{
	hide(linkText);
	show(linkButton);
}

function show(object)
{
	object.style.display = 'inline';
}

function hide(object)
{
	object.style.display = 'none';
}

function showLink()
{
	var urlHalves = String(document.location).split('?');
	var newGetVariables = new Array();
	
	newGetVariables.push
	(
		getGetString('dataset', currentDataset, false),
		getGetString('node', selectedNode.id, false),
		getGetString('collapse', collapse, true),
		getGetString('color', useHue(), true),
		getGetString('depth', maxAbsoluteDepth - 1, false),
		getGetString('font', fontSize, false),
		getGetString('key', showKeys, true)
	);
	
	hide(linkButton);
	show(linkText);
	linkText.value = urlHalves[0] + '?' + getVariables.concat(newGetVariables).join('&');
	//linkText.disabled = false;
	linkText.focus();
	linkText.select();
	//linkText.disabled = true;
//	document.location = urlHalves[0] + '?' + getVariables.join('&');
}

function getFirstChild(element)
{
	element = element.firstChild;
	
	if ( element && element.nodeType != 1 )
	{
		element = getNextSibling(element);
	}
	
	return element;
}

function getNextSibling(element)
{
	do
	{
		element = element.nextSibling;
	}
	while ( element && element.nodeType != 1 );
	
	return element;
}

function getPercentage(fraction)
{
	return round(fraction * 100);
}

function hslText(hue)
{
	if ( 1 || snapshotMode )
	{
		// Safari doesn't seem to allow hsl() in SVG
		
		var rgb = hslToRgb(hue, saturation, (lightnessBase + lightnessMax) / 2);
		
		return rgbText(rgb.r, rgb.g, rgb.b);
	}
	else
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
	
	while (hue < 0)
	{
		hue += 1;
	}
	
	while (hue > 1)
	{
		hue -= 1;
	}
	
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

function createCanvas()
{
	canvas = document.createElement('canvas');
	document.body.appendChild(canvas);
	context = canvas.getContext('2d');
}

function load()
{
	document.body.style.overflow = "hidden";
	document.body.style.margin = 0;
	
	createCanvas();
	
	if ( context == undefined )
	{
		document.body.innerHTML = '\
<br/>This browser does not support HTML5 (see \
<a href="http://sourceforge.net/p/krona/wiki/Browser%20support/">Browser support</a>).\
	';
		return;
	}

	if ( typeof context.fillText != 'function' )
	{
		document.body.innerHTML = '\
<br/>This browser does not support HTML5 canvas text (see \
<a href="http://sourceforge.net/p/krona/wiki/Browser%20support/">Browser support</a>).\
	';
		return;
	}
	
	resize();
	
	var kronaElement = document.getElementsByTagName('krona')[0];
	
	var magnitudeName;
	var hueName;
	var hueDefault;
	var hueStart;
	var hueEnd;
	var valueStart;
	var valueEnd;
	
	if ( kronaElement.getAttribute('collapse') != undefined )
	{
		collapse = kronaElement.getAttribute('collapse') == 'true';
	}
	
	if ( kronaElement.getAttribute('key') != undefined )
	{
		showKeys = kronaElement.getAttribute('key') == 'true';
	}
	
	for
	(
		var element = getFirstChild(kronaElement);
		element;
		element = getNextSibling(element)
	)
	{
		switch ( element.tagName.toLowerCase() )
		{
			case 'attributes':
				magnitudeName = element.getAttribute('magnitude');
				//
				for
				(
					var attributeElement = getFirstChild(element);
					attributeElement;
					attributeElement = getNextSibling(attributeElement)
				)
				{
					var tag = attributeElement.tagName.toLowerCase();
					
					if ( tag == 'attribute' )
					{
						var attribute = new Attribute();
						attribute.name = attributeElement.firstChild.nodeValue;
						attribute.displayName = attributeElement.getAttribute('display');
						
						if ( attributeElement.getAttribute('hrefBase') )
						{
							attribute.hrefBase = attributeElement.getAttribute('hrefBase');
						}
						
						if ( attributeElement.getAttribute('target') )
						{
							attribute.target = attributeElement.getAttribute('target');
						}
						
						if ( attribute.name == magnitudeName )
						{
							magnitudeIndex = attributes.length;
						}
						
						if ( attributeElement.getAttribute('listAll') )
						{
							attribute.listAll = attributeElement.getAttribute('listAll').toLowerCase();
						}
						else if ( attributeElement.getAttribute('listNode') )
						{
							attribute.listNode = attributeElement.getAttribute('listNode').toLowerCase();
						}
						else if ( attributeElement.getAttribute('dataAll') )
						{
							attribute.dataAll = attributeElement.getAttribute('dataAll').toLowerCase();
						}
						else if ( attributeElement.getAttribute('dataNode') )
						{
							attribute.dataNode = attributeElement.getAttribute('dataNode').toLowerCase();
						}
						
						if ( attributeElement.getAttribute('mono') )
						{
							attribute.mono = true;
						}
						
						attributes.push(attribute);
					}
					else if ( tag == 'list' )
					{
						var attribute = new Attribute();
						
						attribute.name = attributeElement.firstChild.nodeValue;
						attribute.list = true;
						attributes.push(attribute);
					}
					else if ( tag == 'data' )
					{
						var attribute = new Attribute();
						
						attribute.name = attributeElement.firstChild.nodeValue;
						attribute.data = true;
						attributes.push(attribute);
						
						var enableScript = document.createElement('script');
						var date = new Date();
						enableScript.src =
							attributeElement.getAttribute('enable') + '?' +
							date.getTime();
						document.body.appendChild(enableScript);
					}
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
			
			case 'datasets':
				datasetNames = new Array();
				//
				for ( j = getFirstChild(element); j; j = getNextSibling(j) )
				{
					datasetNames.push(j.firstChild.nodeValue);
				}
				datasets = datasetNames.length;
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
	
	// get GET options
	//
	var urlHalves = String(document.location).split('?');
	var datasetDefault = 0;
	var maxDepthDefault;
	var nodeDefault = 0;
	//
	if ( urlHalves[1] )
	{
		var vars = urlHalves[1].split('&');
		
		for ( i = 0; i < vars.length; i++ )
		{
			var pair = vars[i].split('=');
			
			switch ( pair[0] )
			{
				case 'collapse':
					collapse = pair[1] == 'true';
					break;
				
				case 'color':
					hueDefault = pair[1] == 'true';
					break;
				
				case 'dataset':
					datasetDefault = Number(pair[1]);
					break;
					
				case 'depth':
					maxDepthDefault = Number(pair[1]) + 1;
					break;
				
				case 'key':
					showKeys = pair[1] == 'true';
					break;
				
				case 'font':
					fontSize = Number(pair[1]);
					break;
				
				case 'node':
					nodeDefault = Number(pair[1]);
					break;
				
				default:
					getVariables.push(pair[0] + '=' + pair[1]);
					break;
			}
		}
	}
	
	addOptionElements(hueName, hueDefault);
	setCallBacks();
	
	head.sort(datasetDefault);
	treeViews.push(new TreeView(datasetDefault));
	treeViews.push(new TreeView(1)); // TEMP
	treeViews.push(new TreeView(2)); // TEMP
	treeViews.push(new TreeView(3)); // TEMP
/*	treeViews.push(new TreeView(1)); // TEMP
	treeViews.push(new TreeView(2)); // TEMP
	treeViews.push(new TreeView(1)); // TEMP
	treeViews.push(new TreeView(2)); // TEMP
*/	maxAbsoluteDepth = 0;
	focusTreeView = treeViews[0];
	selectDataset(datasetDefault);
	
	if ( maxDepthDefault && maxDepthDefault < head.maxDepth )
	{
		maxAbsoluteDepth = maxDepthDefault;
	}
	else
	{
		maxAbsoluteDepth = head.maxDepth;
	}
	
	selectNode(nodes[nodeDefault]);
	setFocus(nodes[nodeDefault]);
	
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
	
	newNode.name = domNode.getAttribute('name');
	
	if ( domNode.getAttribute('href') )
	{
		newNode.href = domNode.getAttribute('href');
	}
	
	if ( hueName )
	{
		newNode.hues = new Array();
	}
	
	for ( var i = getFirstChild(domNode); i; i = getNextSibling(i) )
	{
		switch ( i.tagName.toLowerCase() )
		{
		case 'node': 
			var newChild = loadTreeDOM
			(
				i,
				magnitudeName,
				hueName,
				hueStart,
				hueEnd,
				valueStart,
				valueEnd
			);
			newChild.parent = newNode;
			newNode.children.push(newChild);
			break;
			
		default:
			var attributeName = i.tagName.toLowerCase();
			var index = attributeIndex(attributeName);
			//
			newNode.attributes[index] = new Array();
			//
			for ( var j = getFirstChild(i); j; j = getNextSibling(j) )
			{
				if ( attributes[index] == undefined )
				{
					var x = 5;
				}
				if ( attributes[index].list )
				{
					newNode.attributes[index].push(new Array());
					
					for ( var k = getFirstChild(j); k; k = getNextSibling(k) )
					{
						newNode.attributes[index][newNode.attributes[index].length - 1].push(k.firstChild.nodeValue);
					}
				}
				else
				{
					var value = j.firstChild ? j.firstChild.nodeValue : '';
					
					if ( j.getAttribute('href') )
					{
						var target;
						
						if ( attributes[index].target )
						{
							target = ' target="' + attributes[index].target + '"';
						}
						
						value = '<a href="' + attributes[index].hrefBase + j.getAttribute('href') + '"' + target + '>' + value + '</a>';
					}
					
					newNode.attributes[index].push(value);
				}
			}
			//
			if ( attributeName == magnitudeName || attributeName == hueName )
			{
				for ( j = 0; j < datasets; j++ )
				{
					var value = newNode.attributes[index][j] == undefined ? 0 : Number(newNode.attributes[index][j]);
					
					newNode.attributes[index][j] = value;
					
					if ( attributeName == hueName )
					{
						var hue = lerp
						(
							value,
							valueStart,
							valueEnd,
							hueStart,
							hueEnd
						);
						
						if ( hue < hueStart == hueStart < hueEnd )
						{
							hue = hueStart;
						}
						else if ( hue > hueEnd == hueStart < hueEnd )
						{
							hue = hueEnd;
						}
						
						newNode.hues[j] = hue;
					}
				}
			}
			break;
		}
	}
	
	return newNode;
}

function maxAbsoluteDepthDecrease()
{
	if ( maxAbsoluteDepth > 2 )
	{
		maxAbsoluteDepth--;
		head.setMaxDepths();
		handleResize();
	}
}

function maxAbsoluteDepthIncrease()
{
	if ( maxAbsoluteDepth < head.maxDepth )
	{
		maxAbsoluteDepth++;
		head.setMaxDepths();
		handleResize();
	}
}

function measureText(text, bold)
{
	context.font = bold ? fontBold : fontNormal;
	var dim = context.measureText(text);
	return dim.width;
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
	
	return (fontSize * 2.3);
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
		if ( highlightedTreeView.nodeViews[highlightedNode.id].hasChildren() )
		{
			expand(highlightedNode);
		}
	}
	else if ( progress == 1 )//( highlightedNode != selectedNode )
	{
		focusTreeView = highlightedTreeView;
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
		updateDatasetButtons();
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
		updateDatasetButtons();
		updateView();
	}
}

function nextDataset()
{
	var newDataset = currentDataset;
	
	do
	{
		if ( newDataset == datasets - 1 )
		{
			newDataset = 0;
		}
		else
		{
			newDataset++;
		}
	}
	while ( datasetDropDown.options[newDataset].disabled )
	
	selectDataset(newDataset);
}

function onDatasetChange()
{
	selectDataset(datasetDropDown.selectedIndex);
}

function onKeyDown(event)
{
	if
	(
		event.keyCode == 37 &&
		document.activeElement.id != 'search' &&
		document.activeElement.id != 'linkText'
	)
	{
		navigateBack();
		event.preventDefault();
	}
	else if
	(
		event.keyCode == 39 &&
		document.activeElement.id != 'search' &&
		document.activeElement.id != 'linkText'
	)
	{
		navigateForward();
		event.preventDefault();
	}
	else if ( event.keyCode == 38 && datasets > 1 )
	{
		prevDataset();
		
		//if ( document.activeElement.id == 'datasets' )
		{
			event.preventDefault();
		}
	}
	else if ( event.keyCode == 40 && datasets > 1 )
	{
		nextDataset();
		
		//if ( document.activeElement.id == 'datasets' )
		{
			event.preventDefault();
		}
	}
	else if ( event.keyCode == 9 && datasets > 1 )
	{
		selectLastDataset();
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
	if ( event.keyCode == 27 && document.activeElement.id == 'search' )
	{
		search.blur();
		searchDeactivate();
		onSearchChange();
	}
}

function onSearchChange()
{
	nSearchResults = 0;
	head.search();
	
	if ( searchActive )
	{
		searchResults.innerHTML = nSearchResults + ' results';
	}
	else
	{
		searchResults.innerHTML = '';
	}
	
	setFocus(selectedNode);
	draw();
}

function popTranslation()
{
	if ( snapshotMode )
	{
		svg += '</g>';
	}
	else
	{
		context.restore();
	}
}

function prevDataset()
{
	var newDataset = currentDataset;
	
	do
	{
		if ( newDataset == 0 )
		{
			newDataset = datasets - 1;
		}
		else
		{
			newDataset--;
		}
	}
	while ( datasetDropDown.options[newDataset].disabled );
	
	selectDataset(newDataset);
}

function pushTranslation(x, y)
{
	if ( snapshotMode )
	{
		svg += '<g transform="translate(' + x + ',' + y + ')">';
	}
	else
	{
		context.save();
		context.translate(x, y);
	}
}
function resetKeyOffset()
{
	currentKey = 1;
	keyMinTextLeft = treeViews[0].centerXCurrent + treeViews[0].radiusCurrent + buffer - buffer / (keys + 1) / 2 + fontSize / 2;
	keyMinAngle = 0;
}

function resize()
{
	imageWidth = window.innerWidth * .75;
	imageHeight = window.innerHeight;
	
	if ( ! snapshotMode )
	{
		context.canvas.width = imageWidth;
		context.canvas.height = imageHeight;
	}
	
//	var rows = Math.floor(imageHeight / (imageWidth - mapWidth) * Math.floor(Math.sqrt(treeViews.length)));
//	var rows = Math.ceil(treeViews.length * (imageWidth - mapWidth) / imageHeight);
	var rows = Math.round(imageHeight / Math.sqrt(imageHeight * imageWidth / treeViews.length));
	var cols = Math.ceil(treeViews.length / rows);
	
	/*
	if ( rows * cols < treeViews.length )
	{
		rows++;
	}
	*/
	
	while ( (rows - 1) * cols >= treeViews.length )
	{
		rows--;
	}
	
	var minDimension = imageWidth / cols > imageHeight / rows ?
		imageHeight / rows:
		imageWidth / cols;
	
	var colsTest = Math.round(imageWidth / Math.sqrt(imageHeight * imageWidth / treeViews.length));
	var rowsTest = Math.ceil(treeViews.length / colsTest);
	
	while ( (colsTest - 1) * rowsTest >= treeViews.length )
	{
		colsTest--;
	}
	
	var testMinDimension = imageWidth / colsTest > imageHeight / rowsTest ?
		imageHeight / rowsTest:
		imageWidth / colsTest;
	
	if ( testMinDimension > minDimension )
	{
		cols = colsTest;
		rows = rowsTest;
		minDimension = testMinDimension;
	}
	
	//fontSize = Math.floor(minDimension / 50);
	//fontSize = bound(fontSize, (imageWidth + imageHeight) / 200, (imageWidth + imageHeight) / 200);
	//fontSize = Math.floor(bound(fontSize, 6, 12));
	
	maxMapRadius = minDimension * .03;
	buffer = minDimension * .1;
	margin = minDimension * .015;
	var leftMargin = datasets > 1 ? datasetSelectWidth + 30 : 0;
	
	for ( var i = 0; i < treeViews.length; i++ )
	{
		var row = Math.floor(i / cols);
		var col = i % cols;
		
		if ( row == rows - 1 && treeViews.length % cols )
		{
			treeViews[i].centerX.setTarget(imageWidth * (col + .5 + (cols - treeViews.length % cols) / 2) / cols);
		}
		else
		{
			treeViews[i].centerX.setTarget(imageWidth * (col + .5) / cols);
		}
		
		treeViews[i].centerY.setTarget(imageHeight * (row + .5) / rows);
		treeViews[i].radius.setTarget(minDimension / 2 - buffer);
	}
	//context.font = '11px sans-serif';
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
	if ( number >= 1 || number <= -1 )
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

function passClick(e)
{
	mouseClick(e);
}

function searchActivate()
{
	searchActive = true;
	search.value = '';
	search.style.color = 'black';
}

function searchBlur()
{
	if ( search.value == '' )
	{
		searchDeactivate();
	}
}

function searchClear()
{
	searchDeactivate();
	onSearchChange();
}

function searchDeactivate()
{
	searchActive = false;
	search.value = 'Search';
	search.style.color = 'gray';
}

function searchFocus()
{
	if ( ! searchActive )
	{
		searchActivate();
	}
}

function searchResultString(results)
{
	var searchResults = this.searchResults;
	
	if ( this.isSearchResult )
	{
		// don't count ourselves
		searchResults--;
	}
	
	return ' - ' + results + (results > 1 ? ' results' : ' result');
}

function setCallBacks()
{
	canvas.onselectstart = function(){return false;} // prevent unwanted highlighting
	canvas.onmousemove = mouseMove;
	window.onblur = focusLost;
	canvas.onmouseout = focusLost;
	document.onkeyup = onKeyUp;
	document.onkeydown = onKeyDown;
	canvas.onmousedown = mouseClick;
	document.onmouseup = mouseUp;
	keyControl.onclick = toggleKeys;
	collapseCheckBox = document.getElementById('collapse');
	collapseCheckBox.checked = collapse;
	collapseCheckBox.onclick = handleResize;
	maxAbsoluteDepthText = document.getElementById('maxAbsoluteDepth');
	maxAbsoluteDepthButtonDecrease = document.getElementById('maxAbsoluteDepthDecrease');
	maxAbsoluteDepthButtonIncrease = document.getElementById('maxAbsoluteDepthIncrease');
	maxAbsoluteDepthButtonDecrease.onclick = maxAbsoluteDepthDecrease;
	maxAbsoluteDepthButtonIncrease.onclick = maxAbsoluteDepthIncrease;
	fontSizeText = document.getElementById('fontSize');
	fontSizeButtonDecrease = document.getElementById('fontSizeDecrease');
	fontSizeButtonIncrease = document.getElementById('fontSizeIncrease');
	fontSizeButtonDecrease.onclick = fontSizeDecrease;
	fontSizeButtonIncrease.onclick = fontSizeIncrease;
	maxAbsoluteDepth = 0;
	backButton = document.getElementById('back');
	backButton.onclick = navigateBack;
	forwardButton = document.getElementById('forward');
	forwardButton.onclick = navigateForward;
	snapshotButton = document.getElementById('snapshot');
	snapshotButton.onclick = snapshot;
//	details = document.getElementById('details');
	detailsName = document.getElementById('detailsName');
	detailsInfo = document.getElementById('detailsInfo');
	search = document.getElementById('search');
	search.onkeyup = onSearchChange;
	search.onblur = searchBlur;
	search.onfocus = searchFocus;
	searchDeactivate();
	searchResults = document.getElementById('searchResults');
	useHueDiv = document.getElementById('useHueDiv');
	linkButton = document.getElementById('linkButton');
	linkButton.onclick = showLink;
	linkText = document.getElementById('linkText');
	linkText.onblur = hideLink;
	hide(linkText);
	
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
	
	var loadingImageElement = document.getElementById('loadingImage');
	
	if ( loadingImageElement )
	{
		loadingImage = loadingImageElement.src;
	}
}

function toggleDataset(dataset)
{
	var treeView = 0;
	
	while ( treeView < treeViews.length && treeViews[treeView].dataset < dataset )
	{
		treeView++;
	}
	
	if ( treeView < treeViews.length && treeViews[treeView].dataset == dataset )
	{
		// remove
		
		uiDatasetCheckboxes[dataset].checked = false;
		treeViews.splice(treeView, 1);
	}
	else
	{
		// add
		
		uiDatasetCheckboxes[dataset].checked = true;
		
		var treeViewClone = treeView - 1;
		
		if ( treeViewClone < 0 )
		{
			treeViewClone = treeViews.length - 1;
		}
		
		treeViews.splice(treeView, 0, new TreeView(dataset, treeViews[treeViewClone]));
	}
	
	updateDatasets();
}

function selectDataset(newDataset)
{
	var treeView;
	
	for ( var i = 0; i < treeViews.length; i++ )
	{
		if ( treeViews[i].dataset == newDataset )
		{
			treeView = i;
			break;
		}
	}
	
	if ( treeView == undefined )
	{
		treeViews[0].dataset = newDataset;
	}
	else
	{
		treeViews.splice(0, treeView);
	}
	
	treeViews.splice(1, treeViews.length - 1);
	
	for ( var i = 0; i < datasetNames.length; i++ )
	{
		if ( i == newDataset )
		{
			uiDatasetCheckboxes[i].checked = true;
			uiDatasetCheckboxes[i].disabled = treeViews.length == 1;
		}
		else
		{
			uiDatasetCheckboxes[i].checked = false;
			uiDatasetCheckboxes[i].disabled = false;
		}
	}
	
	updateDatasets();
}

function updateDatasets()
{
	lastDataset = currentDataset;
	
	if ( datasets > 1 )
	{
//		datasetDropDown.selectedIndex = currentDataset;
		updateDatasetButtons();
		datasetAlpha.start = 1.5;
		datasetChanged = true;
	}
	
	for ( var i = 0; i < treeViews.length; i++ )
	{
		treeViews[i].nodeViews[head.id].setMagnitudes(0);
	}
	
	head.setDepth(1, 1);
	head.setMaxDepths();
	handleResize();
}

function selectLastDataset()
{
	selectDataset(lastDataset);
	handleResize();
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
	
	updateDatasetButtons();
}

function setFocus(node)
{
	if ( node == focusNode )
	{
//		return;
	}
	
	focusNode = node;
	
	if ( node.href )
	{
		detailsName.innerHTML =
			'<a target="_blank" href="' + node.href + '">' + node.name + '</a>';
	}
	else
	{
		detailsName.innerHTML = node.name;
	}
	
	var table = '<table>';
	
	table += '<tr><td></td></tr>';
	
	for ( var i = 0; i < node.attributes.length; i++ )
	{
		if ( attributes[i].displayName && node.attributes[i] != undefined )
		{
			var index = node.attributes[i].length == 1 && attributes[i].mono ? 0 : focusTreeView.dataset;
			
			if ( node.attributes[i][index] != undefined && node.attributes[i][focusTreeView.dataset] != '' )
			{
				var value = node.attributes[i][index];
				
				if ( attributes[i].listNode != undefined )
				{
					value =
						'<a href="" onclick="showList(' +
						attributeIndex(attributes[i].listNode) + ',' + i +
						',false);return false;" title="Show list">' +
						value + '</a>';
				}
				else if ( attributes[i].listAll != undefined )
				{
					value =
						'<a href="" onclick="showList(' +
						attributeIndex(attributes[i].listAll) + ',' + i +
						',true);return false;" title="Show list">' +
						value + '</a>';
				}
				else if ( attributes[i].dataNode != undefined && dataEnabled )
				{
					value =
						'<a href="" onclick="showData(' +
						attributeIndex(attributes[i].dataNode) + ',' + i +
						',false);return false;" title="Show data">' +
						value + '</a>';
				}
				else if ( attributes[i].dataAll != undefined && dataEnabled )
				{
					value =
						'<a href="" onclick="showData(' +
						attributeIndex(attributes[i].dataAll) + ',' + i +
						',true);return false;" title="Show data">' +
						value + '</a>';
				}
				
				table +=
					'<tr><td><strong>' + attributes[i].displayName + ':</strong></td><td>' +
					value + '</td></tr>';
			}
		}
	}
	
	table += '</table>';
	detailsInfo.innerHTML = table;
	
	//if ( focusNode != selectedNode )
	{
		var max = 0;
		
		for ( var i = 0; i < uiDatasetCharts.length; i++ )
		{
			var fraction = focusNode.getMagnitude(i) / selectedNode.getMagnitude(i);
			
			if ( fraction > max )
			{
				max = fraction;
			}
		}
		
		for ( var i = 0; i < uiDatasetCharts.length; i++ )
		{
			var width = focusNode.getMagnitude(i) / selectedNode.getMagnitude(i) / max * 25;
			uiDatasetCharts[i].style.width = width + 'px';
			
			if ( useHue() )
			{
				uiDatasetCharts[i].style.backgroundColor = hslText(focusNode.hues[i]);
			}
			else
			{
				uiDatasetCharts[i].style.backgroundColor = rgbText
				(
					treeViews[0].nodeViews[focusNode.id].r.end,
					treeViews[0].nodeViews[focusNode.id].g.end,
					treeViews[0].nodeViews[focusNode.id].b.end
				);
			}
		}
	}
}

var toolTip;
var uiKeyRowsById;

function setHighlightedDataset(dataset)
{
	uiDatasetRowsById[dataset].style.backgroundColor = "#EEEEEE";
}

function setHighlightedNode(node)
{
	if ( uiKeyRowsById != undefined )
	{
		if ( uiKeyRowsById[highlightedNode.id] != undefined )
		{
			uiKeyRowsById[highlightedNode.id].style.backgroundColor = "#FFFFFF";
			
			if ( toolTip != undefined )
			{
				document.body.removeChild(toolTip);
				toolTip = undefined;
			}
		}
		if ( uiKeyRowsById[node.id] != undefined )
		{
			uiKeyRowsById[node.id].style.backgroundColor = "#EEEEEE";
			
			if ( uiKeyRowsById[node.id].kronaShortened )
			{
				toolTip = document.createElement('div');
				document.body.appendChild(toolTip);
				toolTip.style.height = uiKeyRowsById[node.id].clientHeight + 'px';
				toolTip.style.border = '1px solid black';
				toolTip.style.padding = '1px 1px 0px 1px';
				toolTip.style.position = 'absolute';
				toolTip.style.font = fontNormal;
				toolTip.style.backgroundColor = "#EEEEEE";
				toolTip.innerHTML = node.name;
				toolTip.style.top = (uiKeyRowsById[node.id].offsetTop + uiKeys.offsetTop - uiKeys.scrollTop - 1) + 'px';
				toolTip.style.left = (panel.offsetLeft + uiKeyRowsById[node.id].clientWidth - toolTip.clientWidth - 18) + 'px';
				toolTip.onmouseout = function(){setHighlightedNode(selectedNode)};
				toolTip.onclick = mouseClick;
			}
			else
			{
				uiKeyRowsById[node.id].onmouseout = function(){setHighlightedNode(selectedNode)};
			}
		}
	}
	
	highlightedNode = node;
	
	if ( progress == 1 )
	{
		draw();
	}
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
	
	if ( selectedNode.hasParent(focusNode) )
	{
		setFocus(selectedNode);
	}
}

function shortenDivText(div, width)
{
	var minEndLength = 1;
	
	if ( div.clientWidth > width && div.innerHTML.length > minEndLength * 2 )
	{
		var endLength =
			Math.floor((div.innerHTML.length - 1) * width / div.clientWidth / 2);
		
		if ( endLength < minEndLength )
		{
			endLength = minEndLength;
		}
		
		div.innerHTML =
			div.innerHTML.substring(0, endLength) +
			'...' +
			div.innerHTML.substring(div.innerHTML.length - endLength);
	}
}

function waitForData(dataWindow, target, title, time)
{
	if ( nodeData.length == target )
	{
		var data = nodeData.join('');
		
		dataWindow.document.body.removeChild(dataWindow.document.getElementById('loading'));
		document.body.removeChild(document.getElementById('data'));
		
		if ( true || navigator.appName == 'Microsoft Internet Explorer' ) // :(
		{
			dataWindow.document.open();
			dataWindow.document.write('<pre>' + data + '</pre>');
			dataWindow.document.close();
		}
		else
		{
			var pre = document.createElement('pre');
			dataWindow.document.body.appendChild(pre);
			pre.innerHTML = data;
		}
		
		dataWindow.document.title = title; // replace after document.write()
	}
	else
	{
		var date = new Date();
		
		if ( date.getTime() - time > 10000 )
		{
			dataWindow.document.body.removeChild(dataWindow.document.getElementById('loading'));
			document.body.removeChild(document.getElementById('data'));
			dataWindow.document.body.innerHTML =
				'Timed out loading supplemental files for:<br/>' + document.location;
		}
		else
		{
			setTimeout(function() {waitForData(dataWindow, target, title, time);}, 100);
		}
	}
}

function data(newData)
{
	nodeData.push(newData);
}

function enableData()
{
	dataEnabled = true;
}

function showData(indexData, indexAttribute, summary)
{
	var dataWindow = window.open('', '_blank');
	var title = 'Krona - ' + attributes[indexAttribute].displayName + ' - ' + focusNode.name;
	dataWindow.document.title = title;
	
	nodeData = new Array();
	
	if ( dataWindow && dataWindow.document && dataWindow.document.body != null )
	{
		//var loadImage = document.createElement('img');
		//loadImage.src = "file://localhost/Users/ondovb/Krona/KronaTools/img/loading.gif";
		//loadImage.id = "loading";
		//loadImage.alt = "Loading...";
		//dataWindow.document.body.appendChild(loadImage);
		dataWindow.document.body.innerHTML =
			'<img id="loading" src="' + loadingImage + '" alt="Loading..."></img>';
	}
	
	var scripts = document.createElement('div');
	scripts.id = 'data';
	document.body.appendChild(scripts);
	
	var files = focusNode.getData(indexData, summary);
	
	var date = new Date();
	var time = date.getTime();
	
	for ( var i = 0; i < files.length; i++ )
	{
		var script = document.createElement('script');
		script.src = files[i] + '?' + time;
		scripts.appendChild(script);
	}
	
	waitForData(dataWindow, files.length, title, time);
	
	return false;
}

function showList(indexList, indexAttribute, summary)
{
	var list = focusNode.getList(indexList, summary).join('\n');
	
	var dataWindow = window.open('', '_blank');
	
	if ( true || navigator.appName == 'Microsoft Internet Explorer' ) // :(
	{
		dataWindow.document.open();
		dataWindow.document.write('<pre>' + list + '</pre>');
		dataWindow.document.close();
	}
	else
	{
		var pre = document.createElement('pre');
		dataWindow.document.body.appendChild(pre);
		pre.innerHTML = list;
	}
	
	dataWindow.document.title = 'Krona - ' + attributes[indexAttribute].displayName + ' - ' + focusNode.name;
}

function snapshot()
{
	svg = svgHeader();
	
	resetKeyOffset();
	
	snapshotMode = true;
	
	for ( var i = 0; i < treeViews.length; i++ )
	{
		var selectedNodeView = treeViews[i].nodeViews[selectedNode.id];
		var highlightedNodeView = treeViews[i].nodeViews[highlightedNode.id];
		
		pushTranslation(treeViews[i].centerXCurrent, treeViews[i].centerYCurrent);
		
		resetKeyOffset();
		
		treeViews[i].nodeViews[selectedNode.id].draw(false, false); // draw pie slices
		treeViews[i].nodeViews[selectedNode.id].draw(true, false); // draw labels
		
		popTranslation();
	}
	
	if ( focusNode != 0 && focusNode != selectedNode )
	{
		context.globalAlpha = 1;
		focusNode.drawHighlight(true);
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
		'_blank'
	);
/*	var data = window.open('data:text/plain;charset=utf-8,hello', '_blank');
	var data = window.open('', '_blank');
	data.document.open('text/plain');
	data.document.write('hello');
	data.document.close();
	var button = document.createElement('input');
	button.type = 'button';
	button.value = 'save';
	button.onclick = save;
	data.document.body.appendChild(button);
//	snapshotWindow.document.write(svg);
//	snapshotWindow.document.close();
*/	
}

function spacer()
{
	if ( snapshotMode )
	{
		return '&#160;&#160;&#160;';
	}
	else
	{
		return '   ';
	}
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
<title>Krona (snapshot) - ' +
(datasets > 1 ? datasetNames[currentDataset] + ' - ' : '') + selectedNode.name +
'</title>\
<defs>\
	<style type="text/css">\
	text {font-size: ' + fontSize + 'px; font-family: ' + fontFamily + '; dominant-baseline:central}\
	path {stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	path.wedge {stroke:none}\
	path.line {fill:none;stroke:black;}\
	line {stroke:black;stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	line.tick {stroke-width:' + thinLineWidth * fontSize / 6 + ';}\
	line.pattern {stroke-width:' + thinLineWidth * fontSize / 18 + ';}\
	circle {fill:none;stroke:black;stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	rect {stroke:black;stroke-width:' + thinLineWidth * fontSize / 12 + ';}\
	.highlight {stroke:black;stroke-width:'+ highlightLineWidth * fontSize / 12 + ';}\
	.searchHighlight {fill:rgb(255, 255, 100);stroke:none;}\
	</style>\
<pattern id="hiddenPattern" patternUnits="userSpaceOnUse" \
x="0" y="0" width="' + patternWidth + '" height="' + patternWidth + '">\
<line class="pattern" x1="0" y1="0" x2="' + patternWidth / 2 + '" y2="' + patternWidth / 2 + '"/>\
<line class="pattern" x1="' + patternWidth / 2 + '" y1="' + patternWidth +
'" x2="' + patternWidth + '" y2="' + patternWidth / 2 + '"/>\
</pattern>\
</defs>\
';
}

function svgText(text, x, y, anchor, bold)
{
	if ( typeof(anchor) == 'undefined' )
	{
		anchor = 'start';
	}
	
	return '<text x="' + x + '" y="' + y +
		'" style="font-weight:' + (bold ? 'bold' : 'normal') +
		'" text-anchor="' + anchor + '">' + text + '</text>';
}

function toggleKeys()
{
	if ( showKeys )
	{
		keyControl.value = '…';
		showKeys = false;
	}
	else
	{
		keyControl.value = 'x';
		showKeys = true;
	}
	
	updateKeyControl();
	
	if ( progress == 1 )
	{
		draw();
	}
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
		compress = true;//compressCheckBox.checked;
		shorten = true;//shortenCheckBox.checked;
		
		checkSelectedCollapse();
		updateMaxAbsoluteDepth();
		
		if ( focusNode.getCollapse() || focusNode.depth > maxAbsoluteDepth )
		{
			setFocus(selectedNode);
		}
		else
		{
			setFocus(focusNode);
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
			
			//updateKeyControl();
			
			if ( ! quickLook )
			{
				//checkHighlight();
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

function updateDatasetButtons()
{
	//if ( datasets == 1 )
	{
		return;
	}
	
	var node = selectedNode ? selectedNode : head;
	
	datasetButtonLast.disabled =
		node.attributes[magnitudeIndex][lastDataset] == 0;
	
	datasetButtonPrev.disabled = true;
	datasetButtonNext.disabled = true;
	
	for ( var i = 0; i < datasets; i++ )
	{
		var disable = node.attributes[magnitudeIndex][i] == 0;
		
		datasetDropDown.options[i].disabled = disable;
		
		if ( ! disable )
		{
			if ( i != currentDataset )
			{
				datasetButtonPrev.disabled = false;
				datasetButtonNext.disabled = false;
			}
		}
	}
}

function updateDatasetWidths()
{
	if ( datasets > 1 )
	{
		for ( var i = 0; i < datasets; i++ )
		{
			context.font = fontBold;
			var dim = context.measureText(datasetNames[i]);
			datasetWidths[i] = dim.width;
		}
	}
}

function updateKeyControl()
{
	if ( keys == 0 )//|| progress != 1 )
	{
		keyControl.style.visibility = 'hidden';
	}
	else
	{
		keyControl.style.visibility = 'visible';
		keyControl.style.right = margin + 'px';
		
		if ( showKeys )
		{
			keyControl.style.top =
				imageHeight -
				(
					keys * (keySize + keyBuffer) -
					keyBuffer +
					margin +
					keyControl.clientHeight * 1.5
				) + 'px';
		}
		else
		{
			keyControl.style.top =
				(imageHeight - margin - keyControl.clientHeight) + 'px';
		}
	}
}

function updateView()
{
	if ( selectedNode.depth > maxAbsoluteDepth - 1 )
	{
		maxAbsoluteDepth = selectedNode.depth + 1;
	}
	
	setHighlightedNode(selectedNode);
	
	for ( var i = 0; i < treeViews.length; i++ )
	{
		treeViews[i].angleFactor = 2 * Math.PI / (treeViews[i].nodeViews[selectedNode.id].magnitude);
	}
	
	maxPossibleDepth = Math.floor(treeViews[0].radius / (fontSize * minRingWidthFactor));
	
	if ( maxPossibleDepth < 4 )
	{
		maxPossibleDepth = 4;
	}
	
	compressedRadii = computeRadii(selectedNode);
	maxDisplayDepth = compressedRadii.length;//maxDepth;
	
	mapRadii = computeRadii(head);
	
	lightnessFactor = (lightnessMax - lightnessBase) / (maxDisplayDepth > 8 ? 8 : maxDisplayDepth);
	keyedNodeIds = new Array();
	keys = new Array();
	
	fontSizeText.innerHTML = fontSize;
	fontNormal = fontSize + 'px ' + fontFamily;
	context.font = fontNormal;
	fontBold = 'bold ' + fontSize + 'px ' + fontFamily;
	tickLength = fontSize * .7;
	var dim = context.measureText('...');
	ellipsisWidth = dim.width;
	
	nLabelOffsets = new Array(maxDisplayDepth - 1);
	
	for ( var i = 0; i < maxDisplayDepth - 1; i++ )
	{
		if ( i == maxDisplayDepth - 1 )
		{
			nLabelOffsets[i] = 0;
		}
		else
		{
			var width =
				(compressedRadii[i + 1] - compressedRadii[i]) *
				treeViews[0].radius.end;
			
			nLabelOffsets[i] = Math.floor(width / fontSize / 1.2);
			
			if ( nLabelOffsets[i] > 2 )
			{
				nLabelOffsets[i] = min
				(
					Math.floor(width / fontSize / 1.75),
					5
				);
			}
		}
	}
	
	for ( var i = 0; i < treeViews.length; i++ )
	{
		treeViews[i].resetLabelArrays();
		treeViews[i].nodeViews[head.id].setTargets(0);
	}
	
	if ( treeViews.length == 1 )
	{
		var mapArc = getMapArc(treeViews[0].nodeViews[selectedNode.id]);
		
		mapAngleStart.setTarget(mapArc.start);
		mapAngleEnd.setTarget(mapArc.end);
		mapRadiusInner.setTarget(selectedNode == head ? 0 : mapRadii[selectedNode.getDepth() - 2]);
	}
	
	keySize = ((imageHeight - margin * 3) * 1 / 2) / keys * 3 / 4;
	
	if ( keySize > fontSize * maxKeySizeFactor )
	{
		keySize = fontSize * maxKeySizeFactor;
	}
	
	keyBuffer = keySize / 3;
	
	uiKeyTable.width = '100%';
	uiKeyTable.padding = '0px';
	uiKeyTable.style.font = fontNormal;
	uiKeyTable.innerHTML = '';
	uiKeyRowsById = new Array();
	
	for ( var i = 0; i < keys.length; i++ )
	{
		var nodeView = treeViews[0].nodeViews[keys[i].id];
		
		var row = document.createElement('tr');
		var td1 = document.createElement('td');
		var td2 = document.createElement('td');
		var divName = document.createElement('div');
		
		uiKeyTable.appendChild(row);
		row.appendChild(td1);
		row.appendChild(td2);
		row.kronaNode = keys[i];
		row.onclick = mouseClick;
		//td1.appendChild(divName);
		row.onmouseover = function(){setHighlightedNode(this.kronaNode)};
		uiKeyRowsById[keys[i].id] = row;
		td1.innerHTML = treeViews[0].nodeViews[keys[i].id].shortenLabel(uiKeys.clientWidth - 22);
		row.kronaShortened = divName.innerHTML != keys[i].name;
		divName.style.width = 'auto';
//		shortenDivText(divName, 80);
		td1.style.overflowX = 'hidden';
		td1.style.maxWidth = (uiKeys.clientWidth - 20) + 'px';
		td2.style.width = "15px";
		td2.style.height = "15px";
		row.style.padding = '0px';
		td1.style.padding = '0px';
		td2.style.padding = '0px';
		td2.style.backgroundColor = rgbText(nodeView.r.end, nodeView.g.end, nodeView.b.end);
		td2.style.backgroundImage = 'url("' + image.src + '")';
	}
	
	fontSizeLast = fontSize;
	
	if ( datasetChanged )
	{
		datasetChanged = false;
	}
	else
	{
		datasetAlpha.start = 0;
	}
	
	var date = new Date();
	tweenStartTime = date.getTime();
	progress = 0;
	tweenFrames = 0;
	
	updateKeyControl();
	updateDatasetWidths();
	
	document.title = 'Krona - ' + selectedNode.name;
	updateNavigationButtons();
	snapshotButton.disabled = true;
	
	maxAbsoluteDepthText.innerHTML = maxAbsoluteDepth - 1;
	
	maxAbsoluteDepthButtonDecrease.disabled = (maxAbsoluteDepth == 2);
	maxAbsoluteDepthButtonIncrease.disabled = (maxAbsoluteDepth == head.maxDepth);
	
	if ( collapse != collapseLast && search.value != '' )
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
//	upButton.disabled = (selectedNode.getParent() == 0);
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