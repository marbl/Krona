#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;

my $minScore = -300;

my $script = scriptName();

setOption('name', 'root');
setOption('out', 'RDP.comp.krona.html');
setOption('leafAdd', 1);

my @options =
qw(
	name1,
	out
	depth
	hueBad
	hueGood
	local
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	print "

$script [options] comparison.txt [name1] [name2]

Creates a Krona chart from an RDP library comparison.

";
	printOptions(@options);
	exit;
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

my %all;
my ($fileName, $name1, $name2) = @ARGV;

if ( ! defined $name1 )
{
	$name1 = 'Library 1';
}

if ( ! defined $name2 )
{
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
		print "Error: $fileName is not RDP comparison file.\n";
		exit;
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
#"		
		if ( $rank ) # no rank means unclassified, so no score
		{
			push @lineage, $taxon;
			shift @lineage; # remove root
			
			# leave the rest undefined so the score will only be applied to the leaf
			#
			#$scores[@lineage - 1] = $score;
			
			if ( $score )
			{
				$score = log $score;
			}
			else
			{
				$score = $minScore;
				$minScores++;
			}
			
			addByLineage(\%all, 0, $mag1, \@lineage, undef, $score);
			addByLineage(\%all, 1, $mag2, \@lineage, undef, $score);
		}
		
#		print "$lineageString\n@lineage\n\n";
	}
}

close INFILE;

print "\nWarning: Couldn't log of 0 for $minScores scores.  Used -300.\n\n";

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
	\%all,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	'score',
	getOption('hueGood'),
	getOption('hueBad')
);

