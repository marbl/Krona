#!/usr/bin/env perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

BEGIN
{
	use File::Basename;
	use Cwd 'abs_path';
	use lib dirname(abs_path($0)) . "/../lib";
	use KronaTools;
}

setOption('name', 'root');
setOption('out', 'rdp.comp.krona.html');

# Prevent the magnitude and score of each classification from being added to its
# ancestors. This is necessary because internal nodes are explicitly listed in
# the RDP comparison results.
#
setOption('leafAdd', 1);

my @options =
qw(
	out
	name
	depth
	hueBad
	hueGood
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	my $scriptName = getScriptName();
	
	printHeader("KronaTools $KronaTools::version - $scriptName");
	print
'Creates a Krona chart from an RDP library comparison.
';
	printHeader('Usage');
	print
"$scriptName [options] rdp_comparison [name1] [name2]

";
	printColumns
	(
		'   rdp_comparison',
		'RDP comparison result downloaded as text.',
		'   name',
'A name for each library to appear in the chart. The default is "Library
[1/2]".',
	);
	
	printOptions(@options);
	
	exit 0;
}

my @ranks =
(
	'Domain',
	'Phylum',
	'Class',
	'Order',
	'Family',
	'Genus',
);

my $tree = newTree();
my ($fileName, $name1, $name2) = @ARGV;

if ( ! defined $name1 )
{
	$name1 = 'Library 1';
	$name2 = 'Library 2';
}

my @datasetNames = ($name1, $name2);

my @lineage;
my @scores;
my $minScores;

print "Importing $fileName...\n";

open INFILE, "<$fileName" or die $!;

my $line;

do
{
	$line = <INFILE>;
	
	if ( ! $line )
	{
		ktDie("\"$fileName\" is not RDP comparison file.");
	}
}
while ( <INFILE> !~ /^Rank/ );

while ( my $line = <INFILE> )
{
	chomp $line;
	
	my ($rank, $lineageString, $taxon, $mag1, $mag2, $score) = split / \| /, $line;
	
	if ( $taxon )
	{
		my @lineage = split /"?;"?/, $lineageString;
		
		if ( substr($taxon, 0, 1) eq '"' && substr($taxon, -1, 1) eq '"' )
		{
			$taxon = substr($taxon, 1);
			chop $taxon;
		}
		
		$taxon =~ s/"/&quot;/g;
		
		my @scores;
		
		if ( $rank ) # no rank means unclassified, so no score
		{
			push @lineage, $taxon;
			shift @lineage; # remove root
			
			if ( $score )
			{
				$score = log $score;
			}
			else
			{
				$score = $KronaTools::minEVal;
				$minScores++;
			}
			
			addByLineage($tree, 0, \@lineage, undef, $mag1, $score);
			addByLineage($tree, 1, \@lineage, undef, $mag2, $score);
		}
	}
}

close INFILE;

if ( $minScores)
{
	print "\nWarning: Couldn't log[10] of 0 for $minScores scores.  Approximated as $KronaTools::minEVal.\n\n";
}

my @attributeNames =
(
	'magnitude',
	'score'
);

my @attributeDisplayNames =
(
	'Abundance',
	'Log significance'
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	getOption('hueGood'),
	getOption('hueBad')
);

