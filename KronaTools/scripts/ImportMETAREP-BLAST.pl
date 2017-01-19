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

setOption('out', 'metarep-blast.krona.html');
setOption('name', 'root');

my @options =
qw(
	out
	name
	random
	percentIdentity
	bitScore
	combine
	depth
	cellular
	noRank
	hueBad
	hueGood
	url
	postUrl
	taxonomy
	verbose
	
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{

	printUsage
	(
'Creates a Krona chart by classifying reads based on BLAST results in METAREP
data folders.',
		$KronaTools::argumentNames{'metarep'},
		$KronaTools::argumentDescriptions{'metarep'},
		0,
		1,
		\@options
	);
	
	exit 0;
}

my $tree = newTree();

print "Loading taxonomy...\n";
loadTaxonomy();

my $lastReadID;
my $set = 0;
my @datasetNames;
my $zeroEVal;

foreach my $input (@ARGV)
{
	my ($folder, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	print "Importing $folder...\n";
	
	if ( -e "$folder/blast.tab" )
	{
		open IN, "<$folder/blast.tab" or
			ktDie("Couldn't open blast file in $folder");
	}
	else
	{
		open IN, "gunzip -c $folder/blast.tab.gz |" or
			ktDie("Couldn't open gzipped blast file in $folder.");
	}
	
	while ( my $line = <IN> )
	{
		chomp $line;
		my @values = split /\t/, $line;
		
		my $readID = $values[0];
		
		if ( $readID ne $lastReadID )
		{
			my $ties = 0;
			my %lcaSet;
			my @randomArray;
			my $taxID;
			my $readLength = $values[2];
			
			while ( $values[15] =~ /taxon:(\d+)/g )
			{
				my $newTaxID = $1;
				
				if ( ! taxIDExists($newTaxID) )
				{
					ktWarn("$readID: Taxon $newTaxID does not exist; using root.\n");
					$newTaxID = 1;
				}
				
				if ( getOption('random') )
				{
					push @randomArray, $newTaxID;
				}
				else
				{
					$lcaSet{$newTaxID} = 1;
				}
			}
			
			if ( getOption('random') )
			{
				$taxID = $randomArray[int(rand(scalar @randomArray))];
			}
			else
			{
				$taxID = taxLowestCommonAncestor(keys %lcaSet);
			}
			
			if ( getOption('verbose') )
			{
				print "$readID\ttaxID: $taxID\n";
			}
			
			my $score;
			
			if ( getOption('percentIdentity') )
			{
				$score = $values[11];
			}
			elsif ( getOption('bitScore') )
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
					$score = $KronaTools::minEVal;
					$zeroEVal = 1;
				}
			}
			
			addByTaxID($tree, $set, $taxID, $readID, undef, $score);
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
	ktWarn("Couldn't take base-10 log for e-values of 0.  Approximated as $KronaTools::minEval.");
}

my @attributeNames =
(
	'count',
	'unassigned',
	'taxon',
	'rank',
	'score',
);

my @attributeDisplayNames =
(
	'Peptides',
	'Unassigned',
	'Tax ID',
	'Rank',
	getScoreName()
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	getOption('bitScore') || getOption('percentIdentity') ?
		getOption('hueBad') : 
		getOption('hueGood'),
	getOption('bitScore') || getOption('percentIdentity') ?
		getOption('hueGood') :
		getOption('hueBad')
);

