#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;

my $script = scriptName();

setOption('name', 'root');
setOption('out', 'RDP.krona.html');

my @options =
qw(
	out
	combine
	confidence
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
	print "

$script \\
   [options] \\
   details1.txt[,name1] \\
   [details2.txt[,name2]] ...

Examples:

   $script -c details1.txt details2.txt
   $script details1.txt,'sample 1' details2.txt,'sample 2'

Creates a Krona chart from RDP classifications. By default, separate datasets
will be created for each file (see -c).

";
	printOptions(@options);
	exit;
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

my %all;

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
			print "Error: $fileName is not RDP classification file.\n";
			exit;
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
#			print "$fields[$i]\t$fields[$i+1]\n";
			push @lineage, $fields[$i];
			push @scores, $fields[$i + 1];
		}
		
#		print "@lineage\n";
#		print "@scores\n";
		
		addByLineage(\%all, $set, 1, \@lineage, \@ranks, \@scores);
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
	'Avg. % Confidence',
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
	getOption('hueBad'),
	getOption('hueGood')
);

