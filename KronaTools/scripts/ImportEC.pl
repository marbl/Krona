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

setOption('out', 'ec.krona.html');
setOption('name', 'root');

my @options =
qw(
	out
	name
	combine
	queryCol
	ecCol
	scoreCol
	magCol
	include
	depth
	hueBad
	hueGood
	url
	postUrl
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	printUsage
	(
		'Creates a Krona chart of abundances of EC (Enzyme Commission) numbers
in tab-delimited files.',
		'ec_numbers',
		'Tab-delimited files with EC numbers and (optionally) query IDs,
magnitudes and scores. By default, query IDs, EC numbers and scores will be
taken from columns 1, 2 and 3, respectively (see -q, -e, -s, and -m).',
		1,
		1,
		\@options
	);
	
	exit 0;
}

if ( optionsConflict('queryCol', 'ecCol', 'magCol', 'scoreCol') )
{
	ktWarn('Query column already in use; not reading query IDs.');
	setOption('queryCol', undef);
}

if ( optionsConflict('scoreCol', 'ecCol', 'magCol') )
{
	ktWarn('Score column already in use; not reading scores.');
	setOption('scoreCol', undef);
}

if ( optionsConflict('magCol', 'ecCol') )
{
	ktWarn('Magnitude column already in use; not reading magnitudes.');
	setOption('magCol', undef);
}

my $tree = newTree();

print "Loading EC names...\n";
loadEC();

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
			ktWarn("Query column not defined; not reading magnitudes from \"$magFile.\"");
		}
	}
	
	open IN, "<$file" or die "Couldn't open $file.";
	
	while ( my $line = <IN> )
	{
		my @fields = split /\t/, $line;
		
		my $queryID;
		my $ec = $fields[getOption('ecCol') - 1];
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
		else
		{
			$magnitude = 1;
		}
		
		$ec =~ s/^EC//; # remove 'EC' if present
		
		while ( $ec =~ s/\.-$// ) {}; # repeatedly remove trailing '.-'
		
		if ( $ec ne '' && $ec !~ /^[\d\.]+$/ )
		{
			ktWarn("$queryID: Bad EC ('$ec'); ignoring.");
			$ec = '';
		}
		
		if ( $ec || getOption('include') )
		{
			my @ecs;
			
			if ( $ec )
			{
				@ecs = split /\./, $ec;
			}
			
			addByEC($tree, $set, \@ecs, $queryID, $magnitude, $score);
		}
		
		if ( ! defined $score ) # all lines must have score to be used
		{
			$useScore = 0;
		}
		
		if ( $score < 0 ) # score is probably e-value; flip colors
		{
			$eVal = 1;
		}
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
	'count',
	'unassigned',
	'ec',
);

my @attributeDisplayNames =
(
	$useMag ? 'Magnitude' : (getOption('queryCol') ? undef : 'Count'),
	getOption('queryCol') ? 'Count' : undef,
	'Unassigned',
	'EC'
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
