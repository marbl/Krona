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

setOption('out', 'fcp.krona.html');
setOption('name', 'root');

my @options =
qw(
	out
	name
	combine
	depth
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
'Creates a Krona chart based on the results of FCP (Fragment Classification
Package).',
		'fcp_output',
'Results of running any FCP classification tool (except BLASTN.py, which only
outputs raw BLAST results).',
		1,
		1,
		\@options
	);
	exit 0;
}

my $tree = newTree();
my @datasetNames;
my $set = 0;
my $useMag;

foreach my $input ( @ARGV )
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	my %magnitudes;
	my $totalMagnitude;
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		loadMagnitudes($magFile, \%magnitudes);
		$useMag = 1;
	}
	
	print "   Reading classifications from $fileName...\n";
	
	open INFILE, "<$fileName" or die $!;
	
	<INFILE>; # eat header
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my ($readID, $classification) = split /\t/, $line;
		my @lineage = split /;/, $classification;
		my $magnitude = 1;
		
		if ( %magnitudes )
		{
			if ( defined $magnitudes{$readID} )
			{
				$magnitude = $magnitudes{$readID};
			}
			else
			{
				ktWarn("Query ID \"$readID\" doesn't exist in magnitude file; using 1.");
			}
		}
		
		addByLineage($tree, $set, \@lineage, $readID, $magnitude);
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
	
	close INFILE;
}

my @attributeNames =
(
	'magnitude',
	'magnitudeUnassigned',
	'count',
	'unassigned'
);

my @attributeDisplayNames =
(
	$useMag ? 'Magnitude' : undef,
	$useMag ? 'Unassigned magnitude' : undef,
	'Count',
	'Unassigned'
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
);

