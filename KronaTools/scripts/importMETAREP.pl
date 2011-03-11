#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

# get the path of this script; dependencies are relative
#
my $scriptPath;
BEGIN
{
	use Cwd 'abs_path';
	abs_path($0) =~ /(.*)\//;
	$scriptPath = $1;
}
use lib "$scriptPath/../lib";

use Getopt::Long;
use Krona;

my $outFile = 'metarep.krona.html';
my $name = 'root';
my $random;
my $local;
my $verbose;

GetOptions(
	'o=s' => \$outFile,
	'n=s' => \$name,
	'r'   => \$random,
	'l'   => \$local,
	'v'   => \$verbose
	);


if
(
	@ARGV < 1
)
{
	print '

Description:
   Infers taxonomic abundance from the best BLAST hits listed in the blast.tab
   file in a METAREP data set.

Usage:

importMETAREP.pl <blast.tab>

Options:

   [-o <string>]  Output file name.  Default is metarep.krona.html.

   [-n <string>]  Name of the highest level.  Default is "all".

   [-r]           Break ties for the top hit randomly.  Default is to use the
                  lowest common ancestor of all ties for the top hit.

   [-l]           Create a local chart, which does not require an internet
                  connection to view (but will only work on this computer).

   [-v]           Verbose.

';
	exit;
}

my ($input) = @ARGV;

my $minScore = 100;
my $maxScore = 0;

my $tree = newTree();

# taxonomy must be loaded for LCA

print "Loading taxonomy...\n";
loadTaxonomy();

print "Creating tree...\n";

open IN, "<$ARGV[0]" or die $!;

my $lastReadID;

while ( my $line = <IN> )
{
	chomp $line;
	my @values = split /\t/, $line;
	
	my $readID = $values[0];
	
	if ( $readID ne $lastReadID )
	{
		my $ties = 0;
		my $taxID;
		my $readLength = $values[2];
		
		while ( $values[15] =~ /taxon:(\d+)/g )
		{
			my $newTaxID = $1;
			
			if ( ! taxIDExists($newTaxID) )
			{
				print STDERR "$readID: Taxon $newTaxID does not exist; using root.\n";
				$newTaxID = 1;
			}
			
			if ( $random && int(rand(++$ties)) == 0 )
			{
				$taxID = $newTaxID;
			}
			elsif ( ! $random )
			{
				if ( $taxID )
				{
					$taxID = lowestCommonAncestor($taxID, $newTaxID);
				}
				else
				{
					$taxID = $newTaxID;
				}
			}
		}
		
		if ( $verbose )
		{
			print "$readID\ttaxID: $taxID\n";
		}
		
		my $score = $values[11];
		
		if ( $score < $minScore )
		{
			$minScore = $score;
		}
		
		if ( $score > $maxScore )
		{
			$maxScore = $score;
		}
		
		add($tree, $taxID, $readLength, $values[11]);
	}
	
	$lastReadID = $readID;
}

close IN;

my @attributeNames =
(
	'taxon',
	'rank',
	'score',
);

my @attributeDisplayNames =
(
	'Taxon',
	'Rank',
	'Avg. % Similarity'
);

writeTree
(
	$tree,
	$name,
	$outFile,
	$local,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	'score',
	0,
	120,
	$minScore,
	$maxScore
);

