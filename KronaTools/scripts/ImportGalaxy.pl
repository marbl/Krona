#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

# get the path of this script; dependencies should be in the same directory
#
my $scriptPath;
BEGIN
{
	use Cwd 'abs_path';
	abs_path($0) =~ /(.*)\//;
	$scriptPath = $1;
}
use lib "$scriptPath/../lib";

use Krona;

my @options =
qw(
	out
	name
	combine
	depth
	local
	url
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
	print '

ktImportGalaxy \
   [options] \
   file1.txt[,name1] \
   [file2.txt[,name2]] ...

Creates a Krona chart based the results of "Fetch taxonomic representation".

';
	printOptions(@options);
	exit;
}

my %all;
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

my @datasetNames;
my $set = 0;

foreach my $input ( @ARGV )
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
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
		
		shift @lineage; # eat query ID
		my $taxID = shift @lineage;
		shift @lineage; # eat root
		
		map { if ( $_ eq 'n' ) { $_ = '' } } @lineage;
		
		addByLineage(\%all, $set, 1, \@lineage, \@ranks, undef, $taxID);
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
	'magnitude',
	'rank',
	'taxon',
);

my @attributeDisplayNames =
(
	'Reads',
	'Rank',
	'Taxon'
);

writeTree
(
	\%all,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames
);

