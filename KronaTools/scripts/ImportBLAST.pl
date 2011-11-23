#! /usr/bin/perl

# Copyright © 2011, Battelle National Biodefense Institute (BNBI);
# all rights reserved. Authored by: Brian Ondov, Nicholas Bergman, and
# Adam Phillippy
#
# See the LICENSE.txt file included with this software for license information.


use strict;

use lib (`ktGetLibPath`);
use KronaTools;

my $totalMag;

setOption('out', 'blast.krona.html');
setOption('name', 'Root');

my @options =
qw(
	out
	radius
	include
	random
	identity
	score
	combine
	depth
	hueBad
	hueGood
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
   Infers taxonomic abundance from BLAST results.  By default, each
   BLAST result file will create a separate dataset named after the file
   (see -c).

Usage:

ktImportBLAST [options] \
   blast_output_1[:magnitude_file_1][,name_1] \
   [blast_output_2[:magnitude_file_2][,name_2]] \
   ...

Input:

   blast_output      File containing BLAST results in tabular format ("Hit table
	                 (text)" when downloading from NCBI).  If running BLAST
                     locally, subject IDs in the local database must contain GI
                     numbers in "gi|12345" format.
   
   [magnitude_file]  Optional file listing query IDs with magnitudes, separated
                     by tabs.  The can be used to account for read length or
                     contig depth to obtain a more accurate representation of
                     abundance.  By default, query sequences without specified
                     magnitudes will be assigned a magnitude of 1.  Magnitude
                     files for Newbler or Celera Assembler assemblies can be
                     created with getContigMagnitudesNewbler.pl or
                     getContigMagnitudesCA.pl
Options:

';
	printOptions(@options);
	exit;
}

my %tree;

# load taxonomy

print "Loading taxonomy...\n";
loadTaxonomy();

# parse BLAST results

my $set = 0;
my @datasetNames;

foreach my $input (@ARGV)
{
	my ($fileName, $magFile, $name) = parseDataset($input);
	
	if ( ! getOption('combine') )
	{
		push @datasetNames, $name;
	}
	
	print "Importing $fileName...\n";
	
	my %magnitudes;
	my %totalScores;
	my %counts;
	
	classifyBlast($fileName, $magFile, \%magnitudes, \%totalScores, \%counts);
	
	print "   Computing tree...\n";
	
	foreach my $taxID ( keys %magnitudes )
	{
		addByTaxID
		(
			\%tree,
			$set,
			$taxID,
			$magnitudes{$taxID},
			$totalScores{$taxID} / $counts{$taxID}
		);
	}
	
	if ( ! getOption('combine') )
	{
		$set++;
	}
}

my @attributeNames =
(
	'taxon',
	'rank',
	'score',
	'magnitude'
);

my $scoreName;

if ( getOption('identity') )
{
	$scoreName = 'Avg. % identity';
}
elsif ( getOption('score') )
{
	$scoreName = 'Avg. bit score';
}
else
{
	$scoreName = 'Avg. log e-value';
}

my @attributeDisplayNames =
(
	'Taxon',
	'Rank',
	$scoreName,
	'Total'
);

writeTree
(
	\%tree,
	'magnitude',
	\@attributeNames,
	\@attributeDisplayNames,
	\@datasetNames,
	'score',
	getOption('score') || getOption('identity') ? getOption('hueBad') : getOption('hueGood'),
	getOption('score') || getOption('identity') ? getOption('hueGood') : getOption('hueBad')
);
