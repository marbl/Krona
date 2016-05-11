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

setOption('name', 'root');
setOption('out', 'rdp.krona.html');

my @options =
qw(
	out
	name
	combine
	minConfidence
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
		'Creates a Krona chart from RDP classifications.',
		'rdp_details',
		'RDP assignment details downloaded as text from the RDP Classifier web
portal or output by the command line RDP Classifier or Multiclassifier.',
		0,
		1,
		\@options
	);
	
	exit 0;
}

my @webRanks =
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
	
	my $webFormat;
	my $line = <INFILE>;
	
	if ( $line =~ /^\s*$/ || $line =~ /^Classifier:/ || $line =~ /;( +|[+-]?);/ )
	{
		$webFormat = 1;
		
		print "   Web portal format detected.\n";
		
		while ( $line !~ /;( +|[+-]?);/ )
		{
			$line = <INFILE>;
			
			if ( ! $line )
			{
				ktDie("Classifications not found in \"$fileName\". Is it an \"Assignment detail\" file?");
			}
		}
	}
	else
	{
		print "   Command line format detected.\n";
	}
	
	while ( $line )
	{
		my $queryID;
		my @lineage;
		my @ranks;
		my @scores;
		my $allRanks;
		
		chomp $line;
		
		if ( $line eq '' ) {next}
		
		if ( $webFormat )
		{
			chop $line; # last '%'
			
			my @fields = split /["%]?; ?"?/, $line;
			
			$queryID = $fields[0];
			
			for ( my $i = 2; $i < @fields; $i += 2 )
			{
				if ( $fields[$i] eq 'Root' )
				{
					$allRanks = 1;
					next;
				}
				
				push @lineage, $fields[$i];
				push @scores, $fields[$i + 1];
			}
		}
		else
		{
			my @fields = split /"?\t"?/, $line;
			
			$queryID = $fields[0];
			
			for ( my $i = 2; $i < @fields; $i += 3 )
			{
				if ( $fields[$i] eq 'Root' )
				{
					next;
				}
				
				push @lineage, $fields[$i];
				push @ranks, $fields[$i + 1];
				push @scores, $fields[$i + 2] * 100;
			}
		}
		
		addByLineage
		(
			$tree,
			$set,
			\@lineage,
			$queryID,
			undef,
			\@scores,
			$webFormat ? ($allRanks ? undef : \@webRanks) : \@ranks
		);
		
		$line = <INFILE>;
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

