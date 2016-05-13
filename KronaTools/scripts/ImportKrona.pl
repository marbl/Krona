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

# defaults
#
setOption('out', 'krona.krona.html');
setOption('hueBad', undef);
setOption('hueGood', undef);
setOption('name', undef);

my @options =
qw(
	out
	name
	combine
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
"Creates a Krona chart from the data in other Krona charts.",
		"krona_chart",
		"Krona HTML file created with KronaTools or the Krona Excel Template",
		1,
		1,
		\@options
	);
	
	exit 0;
}

my $tree = newTree();

my $dataset = 0;
my $nodeID = 0;

my @attributeNames;
my @attributeDisplayNames;
my %attributeDisplayByNames;

my @datasetNames;

my $line;

foreach my $input (@ARGV)
{
	print "Reading $input...\n";
	
	open XML, $input or die "Could not open $input";
	
	while ( $line !~ /<krona/ )
	{
		$line = <XML>;
	}
	
	while ( $line = <XML> )
	{
		if ( $line =~ /<attribute display="([^"]+)".*>([^<]+)<\/attribute>/ )
		{
			if ( $dataset == 0 )
			{
				push @attributeNames, $2;
				push @attributeDisplayNames, $1;
				$attributeDisplayByNames{$2} = $1;
			}
			elsif ( ! $attributeDisplayByNames{$2} || $attributeDisplayByNames{$2} ne $1 )
			{
				ktDie("$input is not compatible with the first chart (\"$ARGV[0]\")");
			}
		}
		elsif ( $line =~ /<dataset>([^<]+)<\/dataset>/ )
		{
			push @datasetNames, $1;
		}
		elsif ( $line =~ /<color attribute="score" hueStart="(\d+)" hueEnd="(\d+)"/ )
		{
			if ( ! defined getOption('hueBad') )
			{
				setOption('hueBad', $1);
			}
			
			if ( ! defined getOption('hueGood') )
			{
				setOption('hueGood', $2);
			}
		}
		elsif ( $line =~ /<node name="([^"]*)"/ )
		{
			if ( $dataset == 0 && ! defined getOption('name') )
			{
				setOption('name', $1);
			}
			
			addXML($tree, \*XML, $dataset, $input);
		}
	}
	
	close XML;
	
	$dataset = @datasetNames;
}

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	getOption('hueBad'),
	getOption('hueGood')
);
