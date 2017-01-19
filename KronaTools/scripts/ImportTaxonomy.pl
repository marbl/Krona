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

setOption('out', 'taxonomy.krona.html');
setOption('name', 'Root');

my @options =
qw(
	out
	name
	include
	combine
	queryCol
	taxCol
	scoreCol
	magCol
	depth
	cellular
	noRank
	hueBad
	hueGood
	url
	postUrl
	taxonomy
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	printUsage
	(
		'Creates a Krona chart based on taxonomy IDs and, optionally, magnitudes
and scores. Taxonomy IDs corresponding to a rank of "no rank" in the database
will be assigned to their parents to make the hierarchy less cluttered (e.g.
"Cellular organisms" will be assigned to "root").',
		'taxonomy',
		'Tab-delimited file with taxonomy IDs and (optionally) query IDs,
magnitudes and scores. By default, query IDs, taxonomy IDs and scores will be
taken from columns 1, 2 and 3, respectively (see -q, -t, -s, and -m). Lines
beginning with "#" will be ignored.',
		1,
		1,
		\@options
	);
	
	exit 0;
}

if ( optionsConflict('queryCol', 'taxCol', 'magCol', 'scoreCol') )
{
	ktWarn('Query column already in use; not reading query IDs.');
	setOption('queryCol', undef);
}

if ( optionsConflict('scoreCol', 'taxCol', 'magCol') )
{
	ktWarn('Score column already in use; not reading scores.');
	setOption('scoreCol', undef);
}

if ( optionsConflict('magCol', 'taxCol') )
{
	ktWarn('Magnitude column already in use; not reading magnitudes.');
	setOption('magCol', undef);
}

my $tree = newTree();

print "Loading taxonomy...\n";
loadTaxonomy();

my $set = 0;
my @datasetNames;
my $useScore = 1; # is score column present?
my $eVal; # is score e-value (inferred by negative scores)?
my $useMag = getOption('magCol'); # using magnitude values?

foreach my $input (@ARGV)
{
	my ($file, $magFile, $name) = parseDataset($input);
	
	my %magnitudes;
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	print "Importing $file...\n";
	
	# load magnitudes
	
	if ( defined $magFile )
	{
		if ( getOption('queryCol') )
		{
			print "   Loading magnitudes from $magFile...\n";
			loadMagnitudes($magFile, \%magnitudes);
			$useMag = 1;
		}
		else
		{
			ktWarn("Query column not defined; not reading magnitudes from \"$magFile\".");
		}
	}
	
	open IN, "<$file" or ktDie("Couldn't open \"$file\".");
	
	while ( <IN> )
	{
		if ( /^#/ )
		{
			next;
		}
		
		chomp;
		
		my @fields = split /\t/;
		
		my $queryID;
		my $taxID = $fields[getOption('taxCol') - 1];
		my $magnitude;
		my $score;
		
		if ( getOption('queryCol') )
		{
			$queryID = $fields[getOption('queryCol') - 1];
		}
		
		if ( getOption('scoreCol') )
		{
			$score = $fields[getOption('scoreCol') - 1];
		}
		
		if ( defined $queryID && defined $magnitudes{$queryID} )
		{
			$magnitude = $magnitudes{$queryID};
		}
		elsif ( defined getOption('magCol') )
		{
			$magnitude = $fields[getOption('magCol') - 1];
		}
		
		if ( $taxID == -2 )
		{
			$taxID = 1;
		}
		elsif ( $taxID == -1 )
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
		
		if ( ! defined $score )
		{
			# all lines must have score to be used
			
			$useScore = 0;
		}
		
		if ( $score < 0 )
		{
			# score is probably e-value; flip colors
			
			$eVal = 1;
		}
		
		addByTaxID($tree, $set, $taxID, $queryID, $magnitude, $score);
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
	
	close IN;
}

my @attributeNames =
(
	'magnitude',
	'magnitudeUnassigned',
	'count',
	'unassigned',
	'taxon',
	'rank',
);

my @attributeDisplayNames =
(
	$useMag ? 'Magnitude' : (getOption('queryCol') ? undef : 'Count'),
	$useMag ? 'Unassigned magnitude' : (getOption('queryCol') ? undef : 'Unassigned'),
	getOption('queryCol') ? 'Count' : undef,
	getOption('queryCol') ? 'Unassigned' : undef,
	'Taxon',
	'Rank',
);

my @scoreArgs;

if ( $useScore )
{
	push @attributeNames, 'score';
	push @attributeDisplayNames, 'Avg. score';
	
	@scoreArgs =
	(
		$eVal ? getOption('hueGood') : getOption('hueBad'),
		$eVal ? getOption('hueBad') : getOption('hueGood')
	)
}

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	@scoreArgs
);

sub optionsConflict
{
	my ($option, @others) = @_;
	
	if ( getOption($option) )
	{
		foreach my $other ( @others )
		{
			if ( getOption($option) == getOption($other) )
			{
				return 1;
			}
		}
	}
	
	return 0;
}
