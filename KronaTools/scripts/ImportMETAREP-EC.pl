#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

# get the path of this script; dependencies are relative
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

setOption('out', 'metarep-ec.krona.html');
setOption('name', 'root');

my @options =
qw(
	out
	combine
	include
	depth
	local
	url
	verbose
);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
	print '

Description:
   Creates a Krona chart of EC (Enzyme Commission) numbers in annotation.tab
   files of METAREP data folders.  By default, separate datasets for each folder
   will be created and named after the folder (see -c), and queries with no EC
   number will be ignored (see -i).

Usage:

ktImportMETAREP [options] <folder_1> <folder_2> ...

Input:

<folders>       METAREP data folders containing an unzipped annotation.tab file.

';
	printOptions(@options);
	exit;
}

my $tree = newTree();

print "Loading EC names...\n";

loadEC();

my $lastReadID;
my $set = 0;
my @datasetNames;

foreach my $folder (@ARGV)
{
	if ( ! getOption('combine') )
	{
		$folder =~ /([^\/]+)\/*$/;
		push @datasetNames, $1;
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
		
		if ( $ec =~ /[-\|]/ )
		{
			print "   Warning ($readID):\n";
			print "      Bad EC ('$values[11]'); ignoring.\n";
			$ec = '';
		}
		if ( $ec || getOption('include') )
		{
			addByEC($tree, $set, $ec, 1);
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
	'magnitude',
	'ec',
);

my @attributeDisplayNames =
(
	'Total',
	'EC'
);

writeTree
(
	$tree,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames
);

