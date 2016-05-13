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

setOption('out', 'metarep-ec.krona.html');
setOption('name', 'root');

my @options =
qw(
	out
	name
	combine
	include
	depth
	url
	postUrl
	verbose
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	printUsage
	(
'Creates a Krona chart of abundances of EC (Enzyme Commission) numbers in METAREP
data folders. By default, queries with no EC number will be ignored (see -i).',
		$KronaTools::argumentNames{'metarep'},
		$KronaTools::argumentDescriptions{'metarep'},
		0,
		1,
		\@options
	);
	
	exit 0;
}

my $tree = newTree();

print "Loading EC names...\n";
loadEC();

my $set = 0;
my @datasetNames;

foreach my $input (@ARGV)
{
	my ($folder, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	print "Importing $folder...\n";
	
	if ( -e "$folder/annotation.tab" )
	{
		open IN, "<$folder/annotation.tab" or die $!;
	}
	else
	{
		open IN, "gunzip -c $folder/annotation.tab.gz |" or die
			"Couldn't open gzipped annotation file in $folder.";
	}
	
	while ( my $line = <IN> )
	{
		my @values = split /\t/, $line;
		
		my $readID = $values[0];
		my $ec = $values[11];
		
		while ( $ec =~ s/\.-$// ) {}; # repeatedly remove trailing '.-'
		
		if ( $ec ne '' && $ec !~ /^[\d\.]+$/ )
		{
			ktWarn("$readID: Bad EC ('$values[11]'); ignoring.");
			$ec = '';
		}
		if ( $ec || getOption('include') )
		{
			my @ecs;
			
			if ( $ec )
			{
				@ecs = split /\./, $ec;
			}
			
			addByEC($tree, $set, \@ecs, $readID);
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
	'count',
	'unassigned',
	'ec',
);

my @attributeDisplayNames =
(
	'Peptides',
	'Unassigned',
	'EC'
);

writeTree
(
	$tree,
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames
);

