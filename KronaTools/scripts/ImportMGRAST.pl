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

setOption('name', 'all');
setOption('out', 'MG-RAST.krona.html');

my @options =
qw(
	out
	name
	combine
	hueBad
	hueGood
	identity
	local
	url
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	print '

importMG-RAST.pl \
   [options] \
   table1.tsv[,name1] \
   [table2.tsv[,name2]] ...

Creates a Krona chart from tables exported from MG-RAST sequence profiles.
The profiles can be metabolic or phylogenetic, but must be consistent between
files.  By default, separate datasets will be created for each file (see -c).

';
	printOptions(@options);
	exit;
}

my %all;
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
		
		if ( getOption('identity') )
		{
			$score = $data[$offset + 2 + @ranks];
		}
		else
		{
			$score = $data[$offset + 1 + @ranks];
		}
		
		addByLineage(\%all, $set, $magnitude, \@lineage, \@ranks, $score);
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
	'score',
	'rank'
);

my @attributeDisplayNames =
(
	'Abundance',
	getOption('identity') ? 'Avg. % identity' : 'Avg. log e-value',
	'Rank'
);

writeTree
(
	\%all,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	'score',
	getOption('identity') ? getOption('hueBad') : getOption('hueGood'),
	getOption('identity') ? getOption('hueGood') : getOption('hueBad')
);

