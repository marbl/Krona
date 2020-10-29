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

# defaults
#
setOption('out', 'blast.krona.html');
setOption('name', 'Root');

my @options =
qw(
	out
	name
	threshold
	include
	includeUnk
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
	factor
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	printUsage
	(
"Creates a Krona chart of taxonomic classifications computed from tabular BLAST
results.",
		$KronaTools::argumentNames{'blast'},
		$KronaTools::argumentDescriptions{'blast'},
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

# parse BLAST results

my $set = 0;
my @datasetNames;
my $useMag;

foreach my $input (@ARGV)
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	my %magnitudes;
	my %taxIDs;
	my %scores;
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	print "Importing $fileName...\n";
	
	# load magnitudes
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		loadMagnitudes($magFile, \%magnitudes);
		$useMag = 1;
	}
	
	print "   Classifying BLAST results...\n";
	classifyBlast($fileName, \%taxIDs, \%scores);
	
	print "   Computing tree...\n";
	
	foreach my $queryID ( keys %taxIDs )
	{
		my $taxID = $taxIDs{$queryID};
		
		if ( $taxID == -1 )
		{
			if ( getOption('include') )
			{
				$taxID = 0;
			}
			else
			{
				next;
			}
		}
		
		addByTaxID
		(
			$tree,
			$set,
			$taxID,
			$queryID,
			$magnitudes{$queryID},
			$scores{$queryID}
		);
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

my @attributeNames =
(
	'magnitude',
	'magnitudeUnassigned',
	'count',
	'unassigned',
	'taxon',
	'rank',
	'score'
);

my @attributeDisplayNames =
(
	$useMag ? 'Magnitude' : undef,
	$useMag ? 'Unassigned magnitude' : undef,
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
	getOption('bitScore') || getOption('percentIdentity') ?
		getOption('hueBad') : 
		getOption('hueGood'),
	getOption('bitScore') || getOption('percentIdentity') ?
		getOption('hueGood') :
		getOption('hueBad')
);
