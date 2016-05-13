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

my @options =
qw(
	out
	name
	combine
	depth
	url
	postUrl
);

# set defaults
#
setOption('out', 'galaxy.krona.html');
setOption('name', 'root');

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	printUsage
	(
		'Creates a Krona chart based Galaxy taxonomic representations.',
		'tax_rep',
		'Results from the "Fetch taxonomic representation" or "Find lowest
diagnostic rank" tools in Galaxy.',
		0,
		1,
		\@options
	);
	exit 0;
}

my @ranks =
qw(
	superkingdom
	kingdom
	subkingdom
	superphylum
	phylum
	subphylum
	superclass
	class
	subclass
	superorder
	order
	suborder
	superfamily
	family
	subfamily
	tribe
	subtribe
	genus
	subgenus
	species
	subspecies
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
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my @lineage = split /\t/, $line;
		
		# eat GI
		#
		if ( @lineage > 24 )
		{
			@lineage = @lineage[0..23];
		}
		
		my $queryID = shift @lineage;
		my $taxID = shift @lineage;
		shift @lineage; # eat root
		
		map { if ( $_ eq 'n' ) { $_ = '' } } @lineage;
		
		addByLineage($tree, $set, \@lineage, $queryID, undef, undef, \@ranks);
#		print "$taxID : @lineage\n";
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
	
	close INFILE;
}

my @attributeNames =
(
	'count',
	'unassigned',
	'rank',
);

my @attributeDisplayNames =
(
	'Reads',
	'Unassigned',
	'Rank',
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames
);

