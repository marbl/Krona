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

my @options =
qw(
	out
	radius
	random
	identity
	score
	verbose
);

setOption('out', 'blast.taxonomy.tab');
setOption('include', 1);

getKronaOptions(@options);

if
(
	@ARGV < 1
)
{
 	print '

Description:
   Infers taxonomic abundance from BLAST results.

Usage:

ktClassifyBLAST [options] \
   blast_output_1[:magnitude_file_1] \
   blast_output_2[:magnitude_file_2] \
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

';
	printOptions(@options);
	exit;
}

my %bestScores;
my %lca;
my %lcaMag;

# load taxonomy

print "Loading taxonomy...\n";
loadTaxonomy();

my %magnitudes;
my %totalScores;
my %counts;

# parse BLAST results

foreach my $input (@ARGV)
{
	my ($fileName, $magFile) = split /:/, $input;
	
	$fileName =~ /([^\/]+)\./;
	
	print "Classifying $fileName...\n";
	
	classifyBlast($fileName, $magFile, \%magnitudes, \%totalScores, \%counts);
}

my $outFile = getOption('out');

print "Writing $outFile...\n";

open OUT, ">$outFile" or die "Could not open $outFile for writing";

foreach my $taxID ( keys %magnitudes )
{
	my $magnitude = $magnitudes{$taxID};
	my $score = $totalScores{$taxID} / $counts{$taxID};
	
	if ( $taxID == 0 )
	{
		$taxID = -1; # for consistency with MEGAN
	}
	
	print OUT "$taxID\t$magnitude\t$score\n";
}

close OUT;
