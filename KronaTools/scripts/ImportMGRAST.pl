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

setOption('name', 'all');
setOption('out', 'mg-rast.krona.html');

my @options =
qw(
	out
	name
	combine
	depth
	hueBad
	hueGood
	percentIdentity
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
		'Creates a Krona chart from MG-RAST organism or functional analyses.',
		'mgrast_table',
		'A table exported from MG-RAST. It can be from organism or functional
analysis, but all tables being imported should be consistent.',
		0,
		1,
		\@options
	);
	
	exit 0;
}

my $tree = newTree();
my @ranks;
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
	
	my $header = <INFILE>;
	my $offset;
	my @fields = split /\t/, $header;
	
	# remove metagenome and source (if present)
	#
	shift @fields;
	#
	if ( $fields[0] eq 'source' )
	{
		shift @fields;
		$offset = 2;
	}
	else
	{
		$offset = 1;
	}
	
	my $i = 0;
	
	while ( $fields[0] ne 'abundance' )
	{
		$ranks[$i] = shift @fields;
		$i++;
	}
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my @data = split /\t/, $line;
		my $magnitude = $data[$offset + @ranks];
		my $score;
		
		my @lineage = @data[$offset..($offset + @ranks - 1)];
		
		map { if ( $_ eq '-' ) { $_ = '' } } @lineage;
		
		if ( getOption('percentIdentity') )
		{
			$score = $data[$offset + 2 + @ranks];
		}
		else
		{
			$score = $data[$offset + 1 + @ranks];
		}
		
		addByLineage($tree, $set, \@lineage, undef, $magnitude, $score, \@ranks);
	}
	
	close INFILE;
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

my @attributeNames =
(
	'magnitude',
	'magnitudeUnassigned',
	'score',
	'rank'
);

my @attributeDisplayNames =
(
	'Abundance',
	'Unassigned',
	getScoreName(),
	'Rank'
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	getOption('percentIdentity') ? getOption('hueBad') : getOption('hueGood'),
	getOption('percentIdentity') ? getOption('hueGood') : getOption('hueBad')
);

