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

setOption('out', 'text.krona.html');
setOption('name', 'all');

my @options =
qw(
	out
	name
	noMag
	combine
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

ktImportText [options] file1.txt[,name1] [file2.txt[,name2]] ...

Creates a Krona chart based on a text file that lists quantities and lineages.
Each line should be a number followed by a list of wedges to contribute to
(starting from the highest level), separated by tabs.  If no wedges are listed
(and just a number is given), it will contribute to the top level.  If the same
lineage is listed more than once, the values will be added.  To have each line
count as 1 instead of specifying quantities, use -q.  By default, separate
datasets will be created for each file (see -c).

';
	printOptions(@options);
	exit;
}

my %all;
my @datasetNames;
my $set = 0;

foreach my $input ( @ARGV )
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	push @datasetNames, $name;
	
	open INFILE, "<$fileName" or die $!;
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my @lineage = split /\t/, $line;
		my $magnitude;
		
		if ( getOption('noMag') )
		{
			$magnitude = 1;
		}
		else
		{
			$magnitude = shift @lineage;
		}
		
		addByLineage(\%all, $set, $magnitude, \@lineage);
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
	
	close INFILE;
}

my @attributeNames =
(
	'magnitude'
);

my @attributeDisplayNames =
(
	'Total'
);

writeTree
(
	\%all,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames
);

