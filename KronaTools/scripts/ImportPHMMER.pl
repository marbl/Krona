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

my $totalMag;
my $outFile = 'report.krona.html';

setOption('out', 'phmmer.krona.html');
setOption('name', 'Root');

my @options =
qw(
	out
	factor
	random
	bitScore
	combine
	depth
	hueBad
	hueGood
	local
	standalone
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
 	printUsage
 	(
 		'Infers taxonomic abundance from PHMMER results.',
		'phmmer_output',
		'PHMMER output.',
		1,
		1,
		\@options
	);
	
	exit 0;
}

my $tree = newTree();

# load taxonomy

print "Loading taxonomy...\n";
loadTaxonomy();

# parse PHMMER results

my $set = 0;
my @datasetNames;
my $useMag;
my $zeroEVal;

foreach my $input (@ARGV)
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	my %magnitudes;
	
	# load magnitudes
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		loadMagnitudes($magFile, \%magnitudes);
		$useMag = 1;
	}
	
	print "Importing $fileName...\n";
	
	open PHMMER, "<$fileName" or ktDie("Couldn't open $fileName");
	
	my $lastQueryID;
	my $topScore;
	my $topEVal;
	my $ties;
	my $taxID;
	my $totalScore;
	
	while ( 1 )
	{
		my $line = <PHMMER>;
		
		chomp $line;
		
		if ( $line =~ /^#/ )
		{
			next;
		}
		
		my
		(
			$hitID,
			$blank1,
			$queryID,
			$blank2,
			$eVal,
			$bitScore
		) = split /\s+/, $line;
		
		if ( $queryID ne $lastQueryID )
		{
			if (  defined $taxID )
			{
				# add the chosen hit from the last queryID
				
				addByTaxID
				(
					$tree,
					$set,
					$taxID,
					$lastQueryID,
					$magnitudes{$lastQueryID},
					$totalScore / $ties
				);
			}
			
			$ties = 0;
			$totalScore = 0;
		}
		
		if ( ! defined $hitID )
		{
			last; # EOF
		}
		
		$hitID =~ /gi\|(\d+)/;
		
		my $gi = $1;
		
		if # this is a 'best' hit if...
		(
			$queryID ne $lastQueryID || # new query ID (including null at EOF)
			$eVal <= getOption('factor') * $topEVal # within e-val factor
		)
		{
			# add score for average
			#
			if ( getOption('bitScore') )
			{
				$totalScore += $bitScore;
			}
			else
			{
				if ( $eVal > 0 )
				{
					$totalScore += (log $eVal) / log 10;
				}
				else
				{
					$totalScore += $KronaTools::minEVal;
					$zeroEVal = 1;
				}
			}
			#
			$ties++;
			
			if # use this hit if...
			(
				! getOption('random') || # using LCA
				$queryID ne $lastQueryID || # new query ID
				int(rand($ties)) == 0 # randomly chosen to replace other hit
			)
			{
				my $newTaxID = getTaxIDFromGI($gi);
				
				if ( ! $newTaxID )
				{
					$newTaxID = 1;
				}
				
				if ( $queryID ne $lastQueryID || getOption('random') )
				{
					$taxID = $newTaxID;
				}
				else
				{
					$taxID = taxLowestCommonAncestor($taxID, $newTaxID);
				}
			}
		}
		
		if ( $queryID ne $lastQueryID )
		{
			$topScore = $bitScore;
			$topEVal = $eVal;
		}
		
		$lastQueryID = $queryID;
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

if ( $zeroEVal )
{
		ktWarn("Input contained e-values of 0. Approximated log[10] of 0 as $KronaTools::minEVal.");
}

my @attributeNames =
(
	'magnitude',
	'count',
	'unassigned',
	'taxon',
	'rank',
	'score'
);

my @attributeDisplayNames =
(
	$useMag ? 'Magnitude' : undef,
	'Count',
	'Unassigned',
	'Tax ID',
	'Rank',
	getScoreName(),
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	getOption('bitScore') ?
		getOption('hueBad') : 
		getOption('hueGood'),
	getOption('bitScore') ?
		getOption('hueGood') :
		getOption('hueBad')
);
