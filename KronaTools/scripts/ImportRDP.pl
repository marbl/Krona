#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;

setOption('name', 'root');
setOption('out', 'rdp.krona.html');

my @options =
qw(
	out
	combine
	minConfidence
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
	printUsage
	(
		'Creates a Krona chart from RDP classifications.',
		'rdp_details',
		'RDP assignment details downloaded as text.',
		0,
		1,
		\@options
	);
	
	exit 0;
}

my @ranks =
(
	'Domain',
	'Phylum',
	'Class',
	'Order',
	'Family',
	'Genus'
);

my $tree = newTree();

my @datasetNames;
my $set = 0;

foreach my $input ( @ARGV )
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	print "Importing $fileName...\n";
	
	open INFILE, "<$fileName" or die $!;
	
	my $line;
	
	do
	{
		$line = <INFILE>;
		
		if ( ! $line )
		{
			ktDie("\"$fileName\" is not RDP classification file.");
		}
	}
	while ( $line !~ /^Details:/ );
	
	while ( my $line = <INFILE> )
	{
		my @lineage;
		my @scores;
		
		chomp $line;
		
		if ( $line eq '' ) {next}
		
		chop $line; # last '%'
		
		my @fields = split /["%]?; "?/, $line;
		
		for ( my $i = 4; $i < @fields; $i += 2 )
		{
			push @lineage, $fields[$i];
			push @scores, $fields[$i + 1];
		}
		
		addByLineage($tree, $set, \@lineage, $fields[0], undef, \@scores, \@ranks);
	}
	
	close INFILE;
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

my @attributeNames =
(
	'count',
	'unassigned',
	'score',
	'rank'
);

my @attributeDisplayNames =
(
	'Count',
	'Unassigned',
	'Avg. % Confidence',
	'Rank'
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	getOption('hueBad'),
	getOption('hueGood')
);

