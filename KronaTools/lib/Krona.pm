# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.

use strict;

package Krona;

use Getopt::Long;


use base 'Exporter';
use Cwd 'abs_path';

our @EXPORT = qw
(
	addByEC
	addByLineage
	addByTaxID
	classifyBlast
	contains
	footer
	getDepth
	getKronaOptions
	getName
	getOption
	getParent
	getRank
	getTaxID
	header
	loadEC
	loadTaxonomy
	lowestCommonAncestor
	newTree
	parseDataset
	printOptions
	scriptName
	setOption
	taxIDExists
	writeTree
);


our $footer =
'
	</data>
</html>
';

my %options =
(
	# global defaults
	
	'collapse' => 1,
	'color' => 0,
	'hueBad' => 0,
	'hueGood' => 120,
	'magCol' => 2,
	'radius' => 10,
	'scoreCol' => 3,
	'showKey' => 1,
	'taxCol' => 1,
	'url' => 'http://krona.sourceforge.net'
);

my %optionFormats =
(
	'combine' => 'c',
	'confidence' => 'm=f',
	'depth' => 'd=i',
	'ecCol' => 'e=i',
	'hueBad' => 'x=i',
	'hueGood' => 'y=i',
	'include' => 'i',
	'local' => 'l',
	'magCol' => 'm=i',
	'name' => 'n=s',
	'noMag' => 'q',
	'out' => 'o=s',
	'phymm' => 'p',
	'identity' => 'p',
	'radius' => 'e=f',
	'random' => 'r',
	'score' => 'b',
	'scoreCol' => 's=i',
	'taxCol' => 't=i',
	'url' => 'u=s',
	'verbose' => 'v'
);

my %optionTypes =
(
	's' => 'string',
	'f' => 'number',
	'i' => 'integer'
);

my %optionDescriptions =
(
	'combine' => 'Combine data from each file, rather than creating separate datasets within the chart.',
	'confidence' => 'Minimum confidence. Each query sequence will only be added to taxa that were predicted with a confidence score of at least this value.',
	'depth' => 'Maximum depth of wedges to include in the chart.',
	'ecCol' => 'Column of input files to use as EC number.',
	'hueBad' => 'Hue (0-360) for "bad" scores.',
	'hueGood' => 'Hue (0-360) for "good" scores.',
	'identity' => 'Use percent identity to compute the average scores of taxa instead of e-value.',
	'include' => 'Include a wedge for queries with no hits.',
	'local' => 'Create a local chart, which does not require an internet connection to view (but will only work on this computer).',
	'magCol' => 'Column of input files to use as magnitude.',
	'name' => 'Name of the highest level.',
	'noMag' => 'Files do not have a field for quantity.',
	'out' => 'Output file name.',
	'phymm' => 'Input is phymm only (no confidence scores).',
	'radius' => 'E-value factor for best hits. Hits with e-values that are within this factor of the highest scoring hit will also be considered best hits and will be included when computing the lowest common ancestor (or picking randomly if -r is specified).',
	'random' => 'Pick from the best hits randomly instead of finding the lowest common ancestor.',
	'score' => 'Use bit scores to compute the average scores of taxa instead of e-values.',
	'scoreCol' => 'Column of input files to use as score.',
	'taxCol' => 'Column of input files to use as taxonomy ID.',
	'url' => 'URL of Krona resources.',
	'verbose' => 'Verbose.'
);

abs_path($0) =~ /(.*)\//;
my $scriptPath = $1;
my $taxonomyDir = "$scriptPath/../taxonomy";
my $ecFile = "$scriptPath/../data/ec.tsv";

my $version = '1.1';
my $javascript = "krona-$version.js";
my $image = "hidden.png";
my $favicon = "favicon.ico";
my $javascriptLocal = "$scriptPath/../src/$javascript";
my $imageLocal = "$scriptPath/../img/$image";
my $faviconLocal = "$scriptPath/../img/$favicon";

my $minEVal = -413;

my @depths;
my @parents;
my @ranks;
my @names;
my %ecNames;

sub addByEC
{
	my
	(
		$node, # hash ref
		$set, # integer
		$ec, # string
		$magnitude, # number
		$score, # number (optional)
		
		# for recursion only
		#
		$depth
	) = @_;
	
	if ( ! $ec )
	{
		$node->{'magnitude'}[$set] += $magnitude;
		$node->{'children'}{'No hits'}{'magnitude'}[$set] += $magnitude;
		
		if ( ! defined $node->{'children'}{'No hits'}{'scoreCount'} )
		{
			$node->{'children'}{'No hits'}{'scoreCount'}[0] = 0;
		}
		
		return;
	}
	
	if ( ! %ecNames )
	{
		die 'EC data not loaded. "loadEC()" must be called first.';
	}
	
	if ( ! defined $depth )
	{
		$depth = () = $ec =~ /\./g;
		$depth++;
	}
	
	# get parent recursively
	
	my $parent;
	my $parentEC = $ec;
	
	$parentEC =~ s/\.?[^\.]+$//; # pop off a number
	
	if ( $parentEC )
	{
		$parent = addByEC($node, $set, $parentEC, $magnitude, $score, $depth - 1);
	}
	else
	{
		$parent = $node;
		$parent->{'magnitude'}[$set] += $magnitude;
	}
	
	# depth early-out
	#
	if ( $options{'depth'} && $depth > $options{'depth'} )
	{
		return;
	}
	
	# add to parent
	
	my $name = $ecNames{$ec};
	my $child;
	
	if ( defined $parent->{'children'}{$name} )
	{
		$child = $parent->{'children'}{$name};
	}
	else
	{
		my %newChild = ();
		
		$parent->{'children'}{$name} = \%newChild;
		$child = $parent->{'children'}{$name};
		
		$child->{'ec'}[0] = ecLink($ec);
	}
	
	${$child->{'magnitude'}}[$set] += $magnitude;
	
	if ( defined $score )
	{
		${$child->{'scoreTotal'}}[$set] += $score * $magnitude;
		${$child->{'scoreCount'}}[$set] += $magnitude;
	}
	
	return $child;
}

sub addByLineage
{
	# add based on an explicit lineage
	
	my
	(
		$node, # hash ref
		$dataset, # integer
		$magnitude, # number
		$lineage, # array ref
		$ranks, # array ref (optional)
		$scores, # number or array ref (optional)
		$taxID, # integer (optional)
		
		# for recursion only
		#
		$index, # current index of input arrays
		$depth # our node depth (since input array elements can be skipped)
	) = @_;
	
	#print "${$node}{'magnitude'}\t$magnitude\t@lineage\n";
	#print "@$lineage\n";
	
	if ( $options{'leafAdd'} )
	{
		# magnitudes are already summarized; instead of adding magnitude to
		# ancestors, directly set it for the lowest level of the lineage and
		# for any ancestors whose magnitude is undefined (in case they are
		# never specified)
		
		if ( ! defined $node->{'magnitude'}[$dataset] || $index == @$lineage )
		{
			$node->{'magnitude'}[$dataset] = $magnitude;
		}
	}
	else
	{
		$node->{'magnitude'}[$dataset] += $magnitude;
	}
	
	if
	(
		$index < @$lineage &&
		( ! $options{'depth'} || $depth < $options{'depth'} )
	)
	{
		my $score;
		
		# skip nameless nodes
		#
		while ( $$lineage[$index] eq '' )
		{
			$index++;
			
			if ( $index == @$lineage )
			{
				if ( $taxID )
				{
					#$node->{'taxon'}[0] = taxonLink($taxID);
				}
				
				return;
			}
		}
		
		my $name = $$lineage[$index];
		
		if ( ref($scores) eq 'ARRAY' )
		{
			$score = $$scores[$index];
		}
		else
		{
			$score = $scores;
		}
		
		if
		(
			! defined $options{'confidence'} ||
			! defined $score ||
			$score > $options{'confidence'}
		)
		{
			my $child;
			
			if ( defined ${$node}{'children'}{$name} )
			{
				$child = ${$node}{'children'}{$name};
			}
			else
			{
				my %newHash = ();
				${$node}{'children'}{$name} = \%newHash;
				$child = ${$node}{'children'}{$name};
				
				if ( $ranks )
				{
					$child->{'rank'}[0] = $$ranks[$index];
				}
			}
			
			if ( defined $score )
			{
				if ( $options{'leafAdd'} )
				{
					# instead of averaging score for ancestors, directly set it
					# for the lowest level of the lineage and for any ancestors
					# whose score is undefined (in case they are never
					# specified)
					
					if
					(
						! defined $child->{'scoreTotal'}[$dataset] ||
						$index == @$lineage - 1
					)
					{
						$child->{'scoreTotal'}[$dataset] = $score;
						$child->{'scoreCount'}[$dataset] = 1;
					}
				}
				else
				{
					$child->{'scoreTotal'}[$dataset] += $score * $magnitude;
					$child->{'scoreCount'}[$dataset] += $magnitude;
				}
#				print "$name\t$score\n";
			}
			
			addByLineage
			(
				$child,
				$dataset,
				$magnitude,
				$lineage,
				$ranks,
				$scores,
				$taxID,
				$index + 1,
				$depth + 1
			);
		}
	}
}

sub addByTaxID
{
	# recursive function to add magnitude to specified node and all
	# ancestors (and create them if they doesn't exist)
	
	my
	(
		$node, # hash ref
		$set, # integer
		$taxID, # integer
		$magnitude, # number
		$score # number (optional)
	) = @_;
	
	if ( $taxID == 0 )
	{
		$node->{'magnitude'}[$set] += $magnitude;
		$node->{'children'}{'No hits'}{'magnitude'}[$set] += $magnitude;
		
		if ( ! defined $node->{'children'}{'No hits'}{'scoreCount'} )
		{
			$node->{'children'}{'No hits'}{'scoreCount'}[0] = 0;
		}
		
		return;
	}
	
	# skip unranked taxonomy nodes
	#
	while ( $taxID > 1 && $ranks[$taxID] eq 'no rank' )
	{
		$taxID = $parents[$taxID];
	}
	
	if ( ! @parents )
	{
		die 'Taxonomy not loaded. "loadTaxonomy()" must be called first.';
	}
	
	# get parent recursively
	#
	my $parent;
	#
	if ( $parents[$taxID] != 1 )#$taxID )
	{
		$parent = addByTaxID($node, $set, $parents[$taxID], $magnitude, $score);
	}
	else
	{
		$parent = $node;
		$parent->{'magnitude'}[$set] += $magnitude;
	}
	
	# depth early-out
	#
	if
	(
		$options{'depth'} &&
		$depths[$taxID] > $options{'depth'}
	)
	{
		return;
	}
	
	# add this node to parent
	#
	if ( $taxID != 1 )
	{
		my $name = $names[$taxID];
		
		my $child;
		
		if ( defined $parent->{'children'}{$name} )
		{
			$child = $parent->{'children'}{$name};
		}
		else
		{
			my %newChild = ();
			
			$parent->{'children'}{$name} = \%newChild;
			$child = $parent->{'children'}{$name};
			
			$child->{'rank'}[0] = $ranks[$taxID];
			$child->{'taxon'}[0] = taxonLink($taxID);
		}
		
		${$child->{'magnitude'}}[$set] += $magnitude;
		
		if ( defined $score )
		{
			${$child->{'scoreTotal'}}[$set] += $score * $magnitude;
			${$child->{'scoreCount'}}[$set] += $magnitude;
		}
		
		return $child;
	}
}

sub classifyBlast
{
	my
	(
		$fileName,
		$magFile,
		$totalMagnitudes,
		$totalScores,
		$totalCounts
	) = @_;
	
	if ( $options{'radius'} < 1 )
	{
		print "\nERROR: E-value factor must be at least 1.\n\n";
		exit;
	}
	
	my %magnitudes;
	
	# load magnitudes
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		
		open MAG, "<$magFile" or die $!;
		
		while ( my $line = <MAG> )
		{
			chomp $line;
			my ( $id, $mag ) = split /\t/, $line;
			$magnitudes{$id} = $mag;
		}
		
		close MAG;
	}
	
	print "   Classifying BLAST results...\n";
	
	open BLAST, "<$fileName";
	
	my $lastQueryID;
	my $topScore;
	my $topEVal;
	my $ties;
	my $taxID;
	my $score;
	my $extraMagnitude;
	my $zeroEVal;
	
	while ( 1 )
	{
		my $line = <BLAST>;
		
		chomp $line;
		
		if ( $line =~ /^#/ )
		{
			if ( $line =~ /Query: ([\S]+)/ )
			{
				# Add the magnitude of the query to the total in case it doesn't
				# have any hits.
				
				my $queryID = $1;
				
				if ( defined $magnitudes{$queryID} )
				{
					$extraMagnitude += $magnitudes{$queryID};
				}
				else
				{
					$extraMagnitude++;
				}
			}
			
			next;
		}
		
		my
		(
			$queryID,
			$hitID,
			$identity,
			$length,
			$mismatches,
			$gaps,
			$queryStart,
			$queryEnd,
			$subjectStart,
			$subjectEnd,
			$eVal,
			$bitScore
		) = split /\t/, $line;
		
		if ( $queryID ne $lastQueryID && defined $taxID )
		{
			# add the chosen hit from the last queryID
			
			my $magnitude;
			
			if ( defined $magnitudes{$lastQueryID} )
			{
				$magnitude = $magnitudes{$lastQueryID};
			}
			else
			{
				$magnitude = 1;
			}
			
			if ( $options{'verbose'} )
			{
				print "$lastQueryID:\ttaxID=$taxID\n";
			}
			
			$totalMagnitudes->{$taxID} += $magnitude;
			$totalScores->{$taxID} += $score;
			$totalCounts->{$taxID}++;
			$extraMagnitude -= $magnitude;
			
			$ties = 1;
		}
		
		if ( ! defined $hitID )
		{
			last; # EOF
		}
		
		$hitID =~ /gi\|(\d+)/;
		
		my $gi = $1;
		
		if
		(
			$queryID ne $lastQueryID ||
			(
				$options{'random'} &&
				$eVal <= $options{'radius'} * $topEVal &&
				int(rand(++$ties)) == 0
			)
		)
		{
			$taxID = getTaxID($gi);
			
			if ( ! $taxID )
			{
				$taxID = 1;
			}
			
			if ( $options{'identity'} )
			{
				$score = $identity;
			}
			elsif ( $options{'score'} )
			{
				$score = $bitScore;
			}
			else
			{
				if ( $eVal > 0 )
				{
					$score = log $eVal;
				}
				else
				{
					$score = $minEVal;#"1e-500";
					$zeroEVal = 1;
				}
			}
		}
		elsif
		(
			! $options{'random'} &&
			$eVal <= $options{'radius'} * $topEVal
		)
		{
			#if ( $eVal <= $topEVal )
			#{
				#print "$queryID\t$eVal\t$topEVal\n";
			#}
			$taxID = lowestCommonAncestor($taxID, getTaxID($gi));
#			$hitIdentity += $identity;
		}
		
		if ( $queryID ne $lastQueryID )
		{
			$topScore = $bitScore;
			$topEVal = $eVal;
		}
		
		$lastQueryID = $queryID;
	}
	
	if ( $options{'include'} && $extraMagnitude )
	{
		$totalMagnitudes->{0} += $extraMagnitude;
		$totalScores->{0} = 0;
		$totalCounts->{0} = 1;
	}
	
	if ( $zeroEVal )
	{
		print "   WARNING: $fileName had e-values of 0. Used $minEVal for log.\n";
	}
}	

sub contains
{
	my ($parent, $child) = @_;
	
	my $depthParent = $depths[$parent];
	
	while ( $depths[$child] > $depths[$parent] )
	{
		$child = $parents[$child];
	}
	
	return $parent == $child;
}

sub dataHeader
{
	my
	(
		$magName,
		$attributes,
		$attributeDisplayNames,
		$datasetNames,
		$hueName,
		$hueStart,
		$hueEnd,
		$valueStart,
		$valueEnd
	) = @_;
	
	my $attributeString;
	my $colorString;
	
	for ( my $i = 0; $i < @$attributes; $i++ )
	{
		$attributeString .= " $$attributes[$i]=\"$$attributeDisplayNames[$i]\"";
	}
	
	if ( defined $hueName )
	{
		my $colorDefault = $options{'color'} ? 'true' : 'false';
		
		$colorString =
			"<color attribute=\"$hueName\" " .
			"hueStart=\"$hueStart\" hueEnd=\"$hueEnd\" " .
			"valueStart=\"$valueStart\" valueEnd=\"$valueEnd\" " .
			"default=\"$colorDefault\" " .
			"></color>";
	}
	
	return '
	<options collapse="' . ($options{'collapse'} ? 'true' : 'false') .
	'" key="' . ($options{'showKey'} ? 'true' : 'false') . '"></options>
	<magnitude attribute="'. $magName . '"></magnitude>
	<attributes' . $attributeString . '></attributes>
	<datasets names="' . (join ',', @$datasetNames) . '"></datasets>
	' . "$colorString\n";
}

sub ecLink
{
	my ($ec) = @_;
	
	my @numbers = split /\./, $ec;
	
	my $path = join '/', @numbers;
	
	if ( @numbers == 4 )
	{
		$path .= ".html";
	}
	
	return "<a target='_blank' href='http://www.chem.qmul.ac.uk/iubmb/enzyme/EC$path'>EC$ec</a>";
}

sub getDepth
{
	return depths[$_[0]];
}

sub getKronaOptions
{
	my %params;
	
	foreach my $option ( @_ )
	{
		$params{$optionFormats{$option}} = \$options{$option};
	}
	
	GetOptions(%params);
}

sub getName {return $names[$_[0]]}

sub getOption
{
	my ($option) = @_;
	
	return $options{$option};
}

sub getParent
{
	return $parents[$_[0]];
}

sub getRank
{
	return $ranks[$_[0]];
}

sub getTaxID
{
	my ($gi) = @_;
	
	open GI, "<$taxonomyDir/gi_taxid.dat" or die $!;
	
	seek GI, $gi * 4, 0;
	
	my $data;
	
	read GI, $data, 4;
	
	my $taxID = unpack "L", $data;
	
	close GI;
	
	if ( 0 && $taxID == 0 )
	{
		return 1;
	}
	else
	{
		return $taxID;
	}
}

sub header
{
	my $javascriptPath;
	my $imagePath;
	my $faviconPath;
	
	if ( $options{'local'} )
	{
		$javascriptPath = $javascriptLocal;
		$imagePath = $imageLocal;
		$faviconPath = $faviconLocal;
	}
	else
	{
		$javascriptPath = "$options{'url'}/$javascript";
		$imagePath = "$options{'url'}/img/$image";
		$faviconPath = "$options{'url'}/img/$favicon";
	}
	
	return '
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
	<head>
		<meta charset="utf-8"/>
		<style>
			body
			{
				margin:0;
			}
		</style>
		<link rel="shortcut icon" href="' . $faviconPath . '"/>
	</head>
	
	<body style="padding:0;position:relative">
		<div id="options" style="position:absolute;left:0;top:0">
 		</div>
		
		<div id="details" style="position:absolute;top:1%;right:2%;text-align:right;">
		</div>
		
		<canvas id="canvas" width="100" height="100">
			This browser does not support HTML5 (see
			<a href="http://sourceforge.net/p/krona/wiki/Browser%20support/">
				Krona browser support</a>).
		</canvas>
		
		<img id="hiddenImage" src="' . $imagePath . '" visibility="hide"/>
		<script name="tree" src="' . $javascriptPath . '"></script>
	</body>
	
	<data>
';
}

sub loadEC
{
	open EC, "<$ecFile" or die "$ecFile not found.";
	
	<EC>; # eat header
	
	while ( <EC> )
	{
		chomp;
		my ($ec, $name) = split /\t/;
		$ecNames{$ec} = $name;
	}
	
	close EC;
}

sub loadTaxonomy
{
	open INFO, "<$taxonomyDir/taxonomy.tab" or die
		"Taxonomy not found.  Was updateTaxonomy.sh run?";
	
	while ( my $line = <INFO> )
	{
		chomp $line;
		my ($id, $depth, $parent, $rank, $name) = split /\t/, $line;
		
		$parents[$id] = $parent;
		$depths[$id] = $depth;
		$ranks[$id] = $rank;
		$names[$id] = $name;
	}
	
	close INFO;
}

sub lowestCommonAncestor
{
	my ($a, $b) = @_;
	
	# degenerate case optimizations
	#
	if ( $a == $b )
	{
		return $a;
	}
	#
	if ( $a == 1 || $b == 1 )
	{
		return 1;
	}
	
	# walk the nodes up to an equal depth
	#
	my $depthA = $depths[$a];
	my $depthB = $depths[$b];
	#
	while ( $depthA > $depthB )
	{
		$a = $parents[$a];
		$depthA--;
	}
	#
	while ( $depthB > $depthA )
	{
		$b = $parents[$b];
		$depthB--;
	}
	
	# now walk both up until they are equal
	#
	while ( $a != $b )
	{
		if ( $a == 1 || $b == 1 )
		{
			# one reached to top first; this shouldn't happen
			
			warn "No common ancestor found for $a and $b; $depthA $depthB";
			return 1;
		}
		
		$a = $parents[$a];
		$b = $parents[$b];
	}
	
	return $a;
}

sub newTree
{
	my %tree = ();
	return \%tree;
}

sub parseDataset
{
	my ($input) = @_;
	
	$input =~ /([^:,]+)(:([^,]+))?(,"?([^"]+)"?)?/;
	
	my ($file, $mag, $name) = ($1, $3, $5);
	
	if ( defined $name )
	{
		$name =~ s/</&amp;lt;/g;
		$name =~ s/>/&amp;gt;/g;
	}
	else
	{
		# get dataset name from file
		
		$file =~ /([^\/]+)\./;
		$name = $1;
	}
	
	#print "$file\t$mag\t$name\n";
	return ($file, $mag, $name);
}

sub printHangingIndent
{
	my ($header, $text, $tab) = @_;
	
	my @words = split /\s+/, $text;
	
	my $col = $tab;
	
	print $header, ' ' x ($tab - (length $header) - 1);
	
	foreach my $word ( @words )
	{
		my $wordLength = length $word;
		
		if ( $col + $wordLength + 1 >= 80 )
		{
			print "\n", ' ' x $tab, $word;
			$col = $tab + $wordLength;
		}
		else
		{
			print " $word";
			$col += $wordLength + 1;
		}
	}
	
	print "\n\n";
}

sub printOptions
{
	my %headers;
	my $maxHeaderLength;
	
	foreach my $option ( @_ )
	{
		my ($short, $type) = split /=/, $optionFormats{$option};
		
		my $header = "   [-$short";
		
		if ( defined $type )
		{
			$header .= " <$optionTypes{$type}>";
		}
		
		$header .= ']';
		
		if ( length $header > $maxHeaderLength )
		{
			$maxHeaderLength = length $header;
		}
		
		$headers{$option} = $header;
	}
	
	print "Options:\n\n";
	
	foreach my $option ( @_ )
	{
		my $description = $optionDescriptions{$option};
		
		if ( defined $options{$option} )
		{
			$description .= " [Default: '$options{$option}']";
		}
		
		printHangingIndent
		(
			$headers{$option},
			$description,
			$maxHeaderLength + 2
		);
	}
}

sub scriptName
{
	$0 =~ /([^\/]+)$/;
	return $1;
}

sub setOption
{
	my ($option, $value) = @_;
	
	$options{$option} = $value;
}

sub setScores
{
	my ($node) = @_;
	
	my $min;
	my $max;
	
	if ( defined $node->{'scoreCount'} )
	{
		$node->{'score'} = ();
		
		for ( my $i = 0; $i < @{$node->{'scoreCount'}}; $i++ )
		{
			my $score;
			
			if ( ${$node->{'scoreCount'}}[$i] )
			{
				$score =
					${$node->{'scoreTotal'}}[$i] /
					${$node->{'scoreCount'}}[$i];
				
				if ( $options{'logScore'} )
				{
					if ( $score > 0 )
					{
						$score = log $score;
					}
					else
					{
						$score = -413;
					}
				}
				
				if ( ! defined $min || $score < $min )
				{
					$min = $score;
				}
				
				if ( ! defined $max || $score > $max )
				{
					$max = $score;
				}
			}
			else
			{
				$score = 0;
			}
			
			if (1)
			{
				$score = sprintf("%g", $score);
			}
			elsif ( $score < 1 )
			{
				$score = sprintf("%.4e", $score);
			}
			else
			{
				$score = sprintf("%.2f", $score);
			}
			
			${$node->{'score'}}[$i] = $score;
		}
	}
	
	if ( defined $node->{'children'} )
	{
		foreach my $child (keys %{$node->{'children'}})
		{
			my ($childMin, $childMax) =
				setScores($node->{'children'}{$child});
			
			if ( ! defined $min || $childMin < $min )
			{
				$min = $childMin;
			}
			
			if ( ! defined $max || $childMax > $max )
			{
				$max = $childMax;
			}
		}
	}
	
	return ($min, $max);
}

sub taxIDExists
{
	return defined $depths[$_[0]];
}

sub taxonLink
{
	my ($taxID) = @_;
	
	return "<a target='taxonomy' href='http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=$taxID'>$taxID</a>";
}

sub toStringXML
{
	my ($node, $name, $depth) = @_;
	
	my $htmlString = '';
	my $hueString = '';
	
	my $attributeString;
	my $colorString;
	
	foreach my $key ( keys %$node )
	{
		if ( $key ne 'children' && $key ne 'scoreCount' && $key ne 'scoreTotal' )
		{
			$attributeString .= (" $key=\"" . (join ',', @{$node->{$key}}) . '"');
		}
	}
	
	my $string = "\t" x $depth . "<node name=\"$name\"$attributeString>\n";
	
	if ( defined $node->{'children'} )
	{
		foreach my $child (keys %{$node->{'children'}})
		{
			$string .= toStringXML($node->{'children'}{$child}, $child, $depth + 1);
		}
	}
	
	return $string . "\t" x $depth . "</node>\n";
}

sub writeTree
{
	my
	(
		$tree,
		$magName,
		$attributes,
		$attributeDisplayNames,
		$datasetNames,
		$hueName,
		$hueStart,
		$hueEnd
	) = @_;
	
	my ($valueStart, $valueEnd);
	
	if ( defined $hueName )
	{
		($valueStart, $valueEnd) = setScores($tree);
	}
	
	print "Writing $options{'out'}...\n";
	
	open OUT, ">$options{'out'}";
	print OUT header();
	print OUT dataHeader
	(
		$magName,
		$attributes,
		$attributeDisplayNames,
		$datasetNames,
		$hueName,
		$hueStart,
		$hueEnd,
		$valueStart,
		$valueEnd
	);
	print OUT toStringXML($tree, $options{'name'}, 1);
	print OUT $footer;
	close OUT;
}

1;
