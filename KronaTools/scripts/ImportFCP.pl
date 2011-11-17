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

setOption('out', 'fcp.krona.html');
setOption('name', 'root');

my @options =
qw(
	out
	name
	combine
	depth
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

ktImportFCP [options] file1.txt[,name1] [file2.txt[,name2]] ...

Creates a Krona chart based on the results of FCP (Fragment Classification
Package). By default, separate datasets will be created for each file (see -c).

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
	
	my %magnitudes;
	my $totalMagnitude;
	
	if ( defined $magFile )
	{
		print "   Loading magnitudes from $magFile...\n";
		
		open MAG, "<$magFile" or die $!;
		
		while ( my $line = <MAG> )
		{
			chomp $line;
			my ( $id, $magnitude ) = split /\t/, $line;
			$magnitudes{$id} = $magnitude;
			$totalMagnitude += $magnitude;
		}
		
		close MAG;
	}
	
	print "   Reading classifications from $fileName...\n";
	
	open INFILE, "<$fileName" or die $!;
	
	<INFILE>; # eat header
	
	while ( my $line = <INFILE> )
	{
		chomp $line;
		
		my ($readID, $classification) = split /\t/, $line;
		my @lineage = split /;/, $classification;
		my $magnitude = 1;
		
		if ( defined %magnitudes )
		{
			if ( defined $magnitudes{$readID} )
			{
				$magnitude = $magnitudes{$readID};
			}
			else
			{
				print STDERR "Warning: Query ID '$readID' doesn't exist in magnitude file; using 1.\n";
			}
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

