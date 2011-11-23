#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;

setOption('out', 'metarep-blast.krona.html');
setOption('name', 'root');

my @options =
qw(
	out
	random
	identity
	score
	combine
	depth
	hueBad
	hueGood
	local
	url
	verbose
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	print '

Description:
   Infers taxonomic abundance from the best BLAST hits listed in the blast.tab
   files of METAREP data folders.  By default, separate datasets for each folder
   will be created and named after the folder (see -c).

Usage:

ktImportMETAREP [options] <folder_1> <folder_2> ...

Input:

<folders>          METAREP data folders containing an unzipped blast.tab file.

';
	printOptions(@options);
	exit;
}

my $tree = newTree();

# taxonomy must be loaded for LCA

print "Loading taxonomy...\n";

loadTaxonomy();

my $lastReadID;
my $set = 0;
my @datasetNames;
my $zeroEVal;

foreach my $folder (@ARGV)
{
	if ( ! getOption('combine') )
	{
		$folder =~ /([^\/]+)\/*$/;
		push @datasetNames, $1;
	}
	
	print "Importing $folder...\n";
	
	if ( -e "$folder/blast.tab" )
	{
		open IN, "<$folder/blast.tab" or die $!;
	}
	else
	{
		open IN, "gunzip -c $folder/blast.tab.gz |" or die
			"Couldn't open gzipped blast file in $folder.";
	}
	
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
					print STDERR
						"   Warning ($readID):\n" .
						"	   Taxon $newTaxID does not exist; using root.\n";
					$newTaxID = 1;
				}
				
				if ( getOption('random') && int(rand(++$ties)) == 0 )
				{
					$taxID = $newTaxID;
				}
				elsif ( ! getOption('random') )
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
			
			if ( getOption('verbose') )
			{
				print "$readID\ttaxID: $taxID\n";
			}
			
			my $score;
			
			if ( getOption('identity') )
			{
				$score = $values[11];
			}
			elsif ( getOption('score') )
			{
				$score = $values[12];
			}
			else
			{
				if ( $values[19] > 0 )
				{
					$score = log $values[19];
				}
				else
				{
					$score = -413;
					$zeroEVal = 1;
				}
			}
			
			addByTaxID($tree, $set, $taxID, 1, $score);
		}
		
		$lastReadID = $readID;
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
	
	close IN;
}

if ( $zeroEVal )
{
	print "\nWARNING: Couldn't take log for e-values of 0.  Used 1e-413.\n\n";
}

my $scoreName;

if ( getOption('identity') )
{
	$scoreName = 'Avg. % Identity';
}
elsif ( getOption('score') )
{
	$scoreName = 'Avg. bit score';
}
else
{
	$scoreName = 'Avg. log e-value';
}

my @attributeNames =
(
	'magnitude',
	'taxon',
	'rank',
	'score',
);

my @attributeDisplayNames =
(
	'Total',
	'Taxon',
	'Rank',
	$scoreName
);

writeTree
(
	$tree,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	'score',
	getOption('score') || getOption('identity') ? getOption('hueBad') : getOption('hueGood'),
	getOption('score') || getOption('identity') ? getOption('hueGood') : getOption('hueBad')
);

